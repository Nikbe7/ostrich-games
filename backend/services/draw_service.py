import time
import os
import asyncio
import logging
import random
from typing import Dict, List, Optional, Set, Any, Union, cast, Tuple
from datetime import datetime
from ..core.supabase import supabase
from .game_service import _valid_words_list, _valid_words_set

logger = logging.getLogger("draw_service")

class DrawGameManager:
    """Manages a single Draw & Guess game room."""

    def __init__(self, game_id: str):
        self.game_id = game_id
        self.word = ""
        self.players: Dict[str, Any] = {}
        self.chooser_id: Optional[str] = None
        self.history: List[Dict[str, Any]] = []
        self.status = "waiting" # waiting, choosing, drawing, finished
        self.message = "Välkommen till Rita & Gissa!"
        self.chat_log: List[Dict[str, Any]] = []
        self.lines: List[Dict[str, Any]] = [] # Stores drawing strokes
        self.dynamic_ai_status: Optional[str] = None
        self.last_activity = time.time()
        self.choosing_started_at: Optional[float] = None
        self.drawing_started_at: Optional[float] = None
        self.guesses_per_player: Dict[str, int] = {}
        self.incorrect_guess_count: int = 0
        self.revealed_indices: List[int] = []
        self.last_hint_at: Optional[float] = None
        self.locked_players: Dict[str, float] = {}
        self.word_difficulty: Optional[str] = None  # "easy", "medium", or "hard"
        
        # Game rules
        self.CHOOSER_TIMEOUT_SECONDS = 300
        self.DRAWING_DURATION_SECONDS = 86400
        self.DRAW_LIMIT_SECONDS = 180
        self.correct_guessers: List[str] = []

    def _update_activity(self):
        self.last_activity = time.time()
        self.save_to_db()

    @property
    def chooser_timed_out(self) -> bool:
        if self.status != 'choosing' or self.choosing_started_at is None:
            return False
        return (time.time() - self.choosing_started_at) >= self.CHOOSER_TIMEOUT_SECONDS

    @property
    def drawing_time_left(self) -> int:
        if self.status != 'drawing' or self.drawing_started_at is None:
            return 0
        elapsed = time.time() - self.drawing_started_at
        left = int(self.DRAWING_DURATION_SECONDS - elapsed)
        return max(0, left)

    @property
    def drawer_time_left(self) -> int:
        if self.status != 'drawing' or self.drawing_started_at is None:
            return 0
        elapsed = time.time() - self.drawing_started_at
        left = int(self.DRAW_LIMIT_SECONDS - elapsed)
        return max(0, left)

    def save_to_db(self):
        state = self.get_state_for_frontend()
        state['real_word'] = self.word
        try:
            data = {"id": self.game_id, "state": state, "last_activity": datetime.utcnow().isoformat()}
            supabase.table('app_games').upsert(data).execute()
        except Exception as e:
            logger.error("Failed to save draw game %s to db: %s", self.game_id, e)

    @classmethod
    def load_from_db(cls, game_id: str) -> Optional['DrawGameManager']:
        try:
            res = supabase.table('app_games').select('state').eq('id', game_id).execute()
            if res.data and len(res.data) > 0:
                gm = cls(game_id)
                state = res.data[0]['state']
                
                gm.word = state.get('real_word', state.get('word', ''))
                gm.status = state.get('status', 'waiting')
                gm.chooser_id = state.get('wordChooser')
                gm.message = state.get('message', '')
                gm.chat_log = state.get('chatLog', [])
                gm.lines = state.get('lines', [])
                gm.history = state.get('history', [])
                gm.correct_guessers = list(state.get('correctGuessers', []))
                gm.guesses_per_player = state.get('guessesPerPlayer', {})
                gm.incorrect_guess_count = state.get('incorrectGuessCount', 0)
                gm.revealed_indices = state.get('revealedIndices', [])
                gm.last_hint_at = state.get('lastHintAt')
                
                # Restore timers
                if state.get('drawingStartedAt'):
                    gm.drawing_started_at = state['drawingStartedAt']
                if state.get('choosingStartedAt'):
                    gm.choosing_started_at = state['choosingStartedAt']
                
                players_list = state.get('players', [])
                for p in players_list:
                    gm.players[p['sessionId']] = {
                        'id': p['sessionId'],
                        'sid': '',
                        'name': p['name'],
                        'score': p['score'],
                        'online': False,
                        'last_seen': time.time() if p.get('isOnline') else 0,
                        'is_chooser': (p['sessionId'] == gm.chooser_id)
                    }
                return gm
        except Exception as e:
            logger.error("Failed to load draw game %s from db: %s", game_id, e)
        return None

    def add_player(self, uuid: str, name: str, sid: str):
        self._update_activity()
        if uuid in self.players:
            self.players[uuid]['online'] = True
            self.players[uuid]['sid'] = sid
            if name:
                self.players[uuid]['name'] = name
        else:
            self.players[uuid] = {
                'id': uuid,
                'sid': sid,
                'name': name,
                'score': 0,
                'online': True,
                'last_seen': time.time(),
                'is_chooser': False
            }

    def remove_player_by_sid(self, sid: str):
        for uuid, p in self.players.items():
            if p['sid'] == sid:
                p['online'] = False
                p['last_seen'] = time.time()
                break

    def start_new_round(self, instigator_id: str):
        self.word = ""
        self.status = 'choosing'
        self.chat_log = []
        self.lines = []
        self.correct_guessers = []
        self.guesses_per_player = {}
        self.incorrect_guess_count = 0
        self.revealed_indices = []
        self.choosing_started_at = time.time()
        self.drawing_started_at = None
        self.last_hint_at = time.time()

        if instigator_id and instigator_id in self.players:
            current_chooser = self.chooser_id
            if current_chooser and current_chooser in self.players:
                self.players[current_chooser]['is_chooser'] = False

            self.chooser_id = instigator_id
            self.players[instigator_id]['is_chooser'] = True
            self.message = f"{self.players[instigator_id]['name']} väljer ord..."
        else:
            # Random fallback is not really used in draw & guess, but kept for safety
            self.status = 'waiting'
            
        self._update_activity()

    def cancel_start_game(self, instigator_id: str):
        if self.status not in ['choosing', 'drawing']: return
        if self.chooser_id != instigator_id: return
        
        # Don't cancel if already drawing and people have guessed
        if self.status == 'drawing' and len(self.correct_guessers) > 0:
            return
            
        self.status = 'waiting'
        if self.chooser_id and self.chooser_id in self.players:
            self.players[self.chooser_id]['is_chooser'] = False
        self.word = ""
        self.chooser_id = None
        self.choosing_started_at = None
        self.drawing_started_at = None
        self.message = "Väntar på att spelet ska börja..."
        self._update_activity()

    def force_cancel_choosing(self):
        if self.status != 'choosing': return
        if self.chooser_id and self.chooser_id in self.players:
            self.players[self.chooser_id]['is_chooser'] = False
        self.chooser_id = None
        self.choosing_started_at = None
        self.status = 'waiting'
        self.message = "Väljaren tog för lång tid — vem som helst kan starta nytt spel!"
        self._update_activity()

    async def choose_word(self, uuid: str, word: str) -> Tuple[bool, str]:
        self._update_activity()
        from ..ai_validator import validate_word_with_ai
        from ..ai_validator import validate_word_with_ai, is_valid_word_format
        
        if self.status != 'choosing':
            return False, "Spelet väntar inte på ett ordval just nu."
            
        if self.chooser_id != uuid:
            return False, "Det är inte din tur att välja ord."
            
        format_valid, format_msg = is_valid_word_format(word)
        if not format_valid:
            return False, format_msg
            
        word_upper = word.upper().strip()
        is_valid = False
        
        if word_upper in _valid_words_set:
            is_valid = True
        else:
            self.dynamic_ai_status = f"Validerar '{word_upper}' med AI..."
            is_valid = await validate_word_with_ai(word_upper)
            self.dynamic_ai_status = None
            
            if is_valid:
                _valid_words_set.add(word_upper)
                _valid_words_list.append(word_upper)
                try:
                    supabase.table('app_words').insert({'word': word_upper}).execute()
                except Exception as e:
                    pass
                    
        if not is_valid:
            if is_valid == "RATE_LIMITED":
                is_valid = True
            else:
                return False, f"Ordet '{word_upper}' finns inte i ordlistan eller godkändes inte av AI."

        self.word = word_upper
        self.status = 'drawing'
        self.choosing_started_at = None
        self.drawing_started_at = time.time()
        self.lines = []
        self.chat_log = []
        self.correct_guessers = []
        self.guesses_per_player = {}
        self.incorrect_guess_count = 0
        self.revealed_indices = []
        self.last_hint_at = time.time()
        
        # Determine word difficulty
        from ..data.draw_words import DRAW_WORDS
        word_check = word.strip()
        if word_check in DRAW_WORDS.get('easy', []) or word_upper in [w.upper() for w in DRAW_WORDS.get('easy', [])]:
            self.word_difficulty = 'easy'
        elif word_check in DRAW_WORDS.get('medium', []) or word_upper in [w.upper() for w in DRAW_WORDS.get('medium', [])]:
            self.word_difficulty = 'medium'
        elif word_check in DRAW_WORDS.get('hard', []) or word_upper in [w.upper() for w in DRAW_WORDS.get('hard', [])]:
            self.word_difficulty = 'hard'
        else:
            self.word_difficulty = 'medium'  # Default for custom/AI-validated words
        
        self.message = f"{self.players[uuid]['name']} ritar nu!"
        return True, "Ord valt!"

    def add_line(self, uuid: str, line: Dict[str, Any]):
        if self.status != 'drawing': return
        if self.chooser_id != uuid: return
        if self.drawer_time_left <= 0: return
        self.lines.append(line)
        self._update_activity()

    def clear_canvas(self, uuid: str):
        if self.status != 'drawing': return
        if self.chooser_id != uuid: return
        if self.drawer_time_left <= 0: return
        self.lines = []
        self._update_activity()

    def process_chat_guess(self, uuid: str, text: str) -> Tuple[bool, str]:
        self._update_activity()
        
        player_name = self.players[uuid]['name'] if uuid in self.players else "Okänd"
        
        # Validate game state
        if self.status != 'drawing':
            self.chat_log.append({'uuid': uuid, 'name': player_name, 'text': text, 'is_correct': False, 'is_system': False})
            return False, ""
            
        if self.chooser_id == uuid:
            # Drawer can chat, but not guess
            self.chat_log.append({'uuid': uuid, 'name': player_name, 'text': text, 'is_correct': False, 'is_system': False})
            return False, ""
            
        if uuid in self.correct_guessers:
            return False, "Du har redan gissat rätt och kan inte skriva mer i chatten."

        # Check if individual lock has expired
        if hasattr(self, 'locked_players') and uuid in self.locked_players:
            if time.time() - self.locked_players[uuid] >= 1800:
                del self.locked_players[uuid]
                self.guesses_per_player[uuid] = 0
            else:
                return False, "Du är låst från att gissa (30 minuter individuellt)."

        # Check guess (case and space insensitive)
        text_normalized = text.replace(" ", "").upper()
        word_normalized = self.word.replace(" ", "").upper()
        
        if text_normalized == word_normalized:
            self.incorrect_guess_count = 0
            
            num_previous_guessers = len(self.correct_guessers)
            
            # Calculate points based on order
            if num_previous_guessers == 0:
                guesser_points = 3
            elif num_previous_guessers == 1:
                guesser_points = 2
            else:
                guesser_points = 1
                
            self.correct_guessers.append(uuid)
            
            # Add points to guesser
            if uuid in self.players:
                self.players[uuid]['score'] += guesser_points
                
            # Add points to drawer
            if self.chooser_id and self.chooser_id in self.players:
                if num_previous_guessers == 0: # First correct guess
                    num_hints = len(self.revealed_indices)
                    if num_hints == 0:
                        drawer_base = 3
                    elif num_hints == 1:
                        drawer_base = 2
                    else:
                        drawer_base = 1
                    
                    # Difficulty bonus
                    difficulty_bonus = 0
                    if self.word_difficulty == 'medium':
                        difficulty_bonus = 1
                    elif self.word_difficulty == 'hard':
                        difficulty_bonus = 2
                    
                    self.players[self.chooser_id]['score'] += drawer_base + difficulty_bonus
                
            self.chat_log.append({
                'uuid': 'system', 
                'name': 'System', 
                'text': f"{player_name} gissade precis rätt!", 
                'is_correct': True, 
                'is_system': True
            })
            
            self._check_round_end()
            return True, f"Du gissade rätt! Det var en {self.word}."
        else:
            if self.guesses_per_player.get(uuid, 0) >= 3:
                return False, "Du har inga gissningar kvar den här rundan."
                
            self.guesses_per_player[uuid] = self.guesses_per_player.get(uuid, 0) + 1
            
            # Lock the player if they reached 3 wrong guesses
            if self.guesses_per_player[uuid] >= 3:
                if not hasattr(self, 'locked_players'):
                    self.locked_players = {}
                self.locked_players[uuid] = time.time()
            
            # Normal chat
            self.chat_log.append({'uuid': uuid, 'name': player_name, 'text': text, 'is_correct': False, 'is_system': False})
            
            self.incorrect_guess_count += 1
            if self.incorrect_guess_count >= 6:
                self.trigger_hint("för många fel")
            
            return False, ""

    def trigger_hint(self, reason="tid"):
        if self.status != 'drawing':
            return False
            
        # Refill guesses for all players
        self.guesses_per_player.clear()
        if hasattr(self, 'locked_players'):
            self.locked_players.clear()
        
        # Max 50% of letters can be revealed
        letters_only_len = len(self.word.replace(' ', ''))
        max_hints = letters_only_len // 2
        
        self.incorrect_guess_count = 0
        self.last_hint_at = time.time()
        
        if len(self.revealed_indices) >= max_hints:
            self.chat_log.append({
                'uuid': 'system', 
                'name': 'System', 
                'text': f"Ledtråd ({reason}): Max antal bokstäver är redan avslöjade! Men alla har fått tillbaka sina 3 gissningar.", 
                'is_correct': False, 
                'is_system': True
            })
            self._update_activity()
            return True
        
        unrevealed = [i for i, c in enumerate(self.word) if c != ' ' and i not in self.revealed_indices]
        if unrevealed:
            chosen_idx = random.choice(unrevealed)
            self.revealed_indices.append(chosen_idx)
            self.chat_log.append({
                'uuid': 'system', 
                'name': 'System', 
                'text': f"Ledtråd ({reason}): En bokstav har avslöjats! Alla har fått tillbaka sina 3 gissningar.", 
                'is_correct': False, 
                'is_system': True
            })
            self._update_activity()
            return True
        return False

    def check_time_up(self):
        """Called by frontend or background task to enforce time limits."""
        if self.status == 'drawing' and self.drawing_time_left <= 0:
            self._end_round()
            return True
        return False

    def _check_round_end(self):
        """End round if 4 people guessed correctly, or if all players in the game have guessed."""
        # Calculate total potential guessers in the lobby (everyone except the drawer)
        total_guessers = len([p for p in self.players if p != self.chooser_id])
        
        # Target is 4, but if there are fewer than 4 players, target is the number of players
        target_correct = min(4, max(1, total_guessers))
        
        if len(self.correct_guessers) >= target_correct:
            self._end_round()

    def abandon_round(self, uuid: str):
        """Allow drawer to prematurely end round if it has been running for > 4 hours."""
        if self.status != 'drawing' or self.chooser_id != uuid:
            return False, "Du kan bara avbryta spelet om du ritar."
        
        if not self.drawing_started_at:
            return False, "Spelet har inte startat ordentligt."
            
        elapsed_hours = (time.time() - self.drawing_started_at) / 3600
        if elapsed_hours <= 4:
            return False, "Rundan måste ha varit öppen i över 4 timmar för att kunna avbrytas."
            
        self.chat_log.append({
            'uuid': 'system', 
            'name': 'System', 
            'text': f"Rundan avbröts av ritaren! Ordet var: {self.word}", 
            'is_correct': False, 
            'is_system': True
        })
        
        self._end_round()
        self._update_activity()
        return True, "Rundan har avslutats."

    def _end_round(self):
        self.status = 'finished'
        self.drawing_started_at = None
        
        self.message = f"Rundan är slut! Ordet var: {self.word}"
        
        self.history.insert(0, {
            'word': self.word,
            'chooser': self.chooser_id,
            'correctGuessers': list(self.correct_guessers),
            'chatLog': self.chat_log.copy()
            # Not storing lines in history to save DB space, as per common skribbl clones, 
            # or store them if we want to show a gallery later. 
            # The prompt said "Spara ritningarna", so let's save them!
        })
        
        # Actually save the drawing in history!
        self.history[0]['lines'] = self.lines.copy()

    def get_state_for_frontend(self):
        display_word = self.word
        if self.status == 'drawing':
            if self.drawing_started_at is None:
                self.drawing_started_at = time.time()
                
            # Hide word for non-drawers (handled by frontend typically, but we should mask it here for security)
            # Actually, frontend needs to know length. 
            # We will send a masked version. The drawer and correct guessers should get the real word.
            # Since this returns a single state broadcasted to all, we MUST mask the word.
            # We'll rely on a separate private message or just let the chooser know they are the chooser.
            # But the chooser needs to see what they are drawing.
            # Solution: send 'wordLength' and 'maskedWord'. If you are chooser or correct guesser, you use local state or we just send the word and trust the client?
            # Standard hangman in this repo trusts the client and sends `real_word` only to DB, but wait!
            # Looking at `game_service.py`: `display_word = "".join([c if c in self.guessed or c == ' ' else '_' for c in self.word])`
            # Yes, the server masks the word before broadcasting!
            # Wait, how does the Hangman chooser know the word? They type it in, so their client knows it.
            # So for Draw, we'll mask it.
            display_word = "".join([c if c == ' ' or i in self.revealed_indices else '_' for i, c in enumerate(self.word)])
            
        elif self.status == 'choosing':
            display_word = "VÄLJER..."

        player_list = []
        for uuid, p in self.players.items():
            player_list.append({
                'sessionId': p['id'],
                'name': p['name'],
                'score': p['score'],
                'isOnline': p.get('online', False),
                'lastSeen': datetime.fromtimestamp(p.get('last_seen', 0)).isoformat(),
                'hasGuessed': p['id'] in self.correct_guessers,
                'is_chooser': (p['id'] == self.chooser_id)
            })

        return {
            'gameId': self.game_id,
            'word': display_word,
            'status': self.status,
            'players': player_list,
            'wordChooser': self.chooser_id,
            'history': self.history,
            'chatLog': self.chat_log,
            'lines': self.lines,
            'message': self.message,
            'dynamic_ai_status': self.dynamic_ai_status,
            'chooserTimedOut': self.chooser_timed_out,
            'chooserDeadline': (self.choosing_started_at + self.CHOOSER_TIMEOUT_SECONDS) if self.choosing_started_at else None,
            'drawingDeadline': (self.drawing_started_at + self.DRAWING_DURATION_SECONDS) if self.drawing_started_at else None,
            'drawingTimeLeft': self.drawing_time_left,
            'drawerTimeLeft': self.drawer_time_left,
            'drawingStartedAt': self.drawing_started_at,
            'correctGuessers': list(self.correct_guessers),
            'guessesPerPlayer': self.guesses_per_player,
            'incorrectGuessCount': self.incorrect_guess_count,
            'revealedIndices': self.revealed_indices,
            'lastHintAt': self.last_hint_at,
            'lockedPlayers': getattr(self, 'locked_players', {}),
            'wordDifficulty': getattr(self, 'word_difficulty', None)
        }


class DrawGameLobby:
    """Manages multiple Draw & Guess game rooms."""

    def __init__(self):
        self.games: Dict[str, DrawGameManager] = {}
        self.user_games: Dict[str, Set[str]] = {}

    def register_player_game(self, user_id: str, game_id: str):
        if user_id not in self.user_games:
            self.user_games[user_id] = set()
        self.user_games[user_id].add(game_id)

    def get_game(self, game_id: str) -> DrawGameManager:
        if game_id not in self.games:
            game = DrawGameManager.load_from_db(game_id)                
            if not game:
                game = DrawGameManager(game_id)
            else:
                for player_id in game.players.keys():
                    self.register_player_game(player_id, game_id)
            self.games[game_id] = game
        return self.games[game_id]

    def count_games_for_user(self, user_id: str) -> int:
        return len(self.user_games.get(user_id, set()))

draw_game_lobby = DrawGameLobby()
