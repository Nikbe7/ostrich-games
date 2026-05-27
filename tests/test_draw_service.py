import pytest
import time
from backend.services.draw_service import DrawGameManager, draw_game_lobby

@pytest.fixture
def draw_game():
    import uuid
    game_id = f"test_draw_{uuid.uuid4()}"
    game = draw_game_lobby.get_game(game_id)
    # Mock save_to_db so we don't hit Supabase in tests
    game.save_to_db = lambda: None
    
    game.add_player("user1", "Alice", "sid1")
    game.add_player("user2", "Bob", "sid2")
    game.add_player("user3", "Charlie", "sid3")
    return game

@pytest.mark.asyncio
async def test_draw_game_flow(draw_game: DrawGameManager):
    # Start round
    draw_game.start_new_round("user1")
    assert draw_game.status == "choosing"
    assert draw_game.chooser_id == "user1"
    
    # Chooser selects a word (mocking AI validator success by using a known valid word or bypassing)
    # We will just bypass the AI by mocking the validator in choose_word or use a dummy word
    # Actually, we can just inject a word manually to avoid mocking the AI in this simple test, 
    # but let's test the public methods.
    # To prevent DB/AI calls, we can monkeypatch `validate_word_with_ai` or just set state directly
    # for the parts that need external calls. Let's just set the word and state.
    draw_game.word = "TESTWORD"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.drawing_started_at = time.time()
    
    # Alice (Drawer) tries to guess - should not be allowed
    draw_game.process_chat_guess("user1", "TESTWORD")
    assert "user1" not in draw_game.correct_guessers
    
    # Bob (Guesser) guesses wrong
    draw_game.process_chat_guess("user2", "WRONG")
    assert len(draw_game.chat_log) == 2 # 1 from Alice, 1 from Bob
    assert not draw_game.chat_log[-1]['is_correct']
    
    # Charlie (Guesser) guesses right
    draw_game.process_chat_guess("user3", "TESTWORD")
    assert "user3" in draw_game.correct_guessers
    assert draw_game.chat_log[-1]['is_correct']
    assert draw_game.chat_log[-1]['is_system']
    
    # Game shouldn't end yet because Bob hasn't guessed correctly
    assert draw_game.status == "drawing"
    
    # Bob guesses right
    draw_game.process_chat_guess("user2", "testword")
    assert "user2" in draw_game.correct_guessers
    
    # Game should end since all guessers got it
    assert draw_game.status == "finished"
    assert len(draw_game.history) == 1
    
def test_draw_game_time_up(draw_game: DrawGameManager):
    draw_game.status = "drawing"
    draw_game.drawing_started_at = time.time() - 86401 # 24 hours ago
    
    is_time_up = draw_game.check_time_up()
    assert is_time_up == True
    assert draw_game.status == "finished"

def test_draw_lines(draw_game: DrawGameManager):
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.drawing_started_at = time.time()
    
    # Alice draws
    draw_game.add_line("user1", {"x": 10, "y": 20})
    assert len(draw_game.lines) == 1
    
    # Bob tries to draw - should be ignored
    draw_game.add_line("user2", {"x": 30, "y": 40})
    assert len(draw_game.lines) == 1
    
    # Alice clears
    draw_game.clear_canvas("user1")
    assert len(draw_game.lines) == 0

def test_drawer_time_limit(draw_game: DrawGameManager):
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.drawing_started_at = time.time()
    
    # Can draw at start
    draw_game.add_line("user1", {"x": 10, "y": 20})
    assert len(draw_game.lines) == 1
    
    # Mock time passing beyond 180 seconds
    draw_game.drawing_started_at = time.time() - 181
    
    # Cannot draw anymore
    draw_game.add_line("user1", {"x": 30, "y": 40})
    assert len(draw_game.lines) == 1
    
    # Cannot clear canvas anymore
    draw_game.clear_canvas("user1")
    assert len(draw_game.lines) == 1

def test_abandon_round(draw_game: DrawGameManager):
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.word = "TEST"
    
    # Needs to be started > 4 hours ago
    draw_game.drawing_started_at = time.time() - 14401 # 4 hours and 1 second ago
    
    # Only chooser can abandon
    success, msg = draw_game.abandon_round("user2")
    assert success == False
    assert "bara avbryta" in msg
    
    # Chooser abandons
    success, msg = draw_game.abandon_round("user1")
    assert success == True
    assert draw_game.status == "finished"
    assert "avbröts av ritaren" in draw_game.chat_log[-1]['text']
    assert draw_game.word in draw_game.chat_log[-1]['text']

def test_abandon_round_too_early(draw_game: DrawGameManager):
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    
    # Started 3 hours ago
    draw_game.drawing_started_at = time.time() - 10800
    
    success, msg = draw_game.abandon_round("user1")
    assert success == False
    assert "över 4 timmar" in msg
    assert draw_game.status == "drawing"

def test_individual_lock_logic(draw_game: DrawGameManager):
    draw_game.word = "TEST"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    
    # 3 wrong guesses
    draw_game.process_chat_guess("user2", "A")
    draw_game.process_chat_guess("user2", "B")
    draw_game.process_chat_guess("user2", "C")
    
    assert draw_game.guesses_per_player.get("user2", 0) == 3
    assert "user2" in draw_game.locked_players
    
    # Try guessing again while locked
    success, msg = draw_game.process_chat_guess("user2", "D")
    assert success is False
    assert "Du är låst från att gissa" in msg or "inga gissningar kvar" in msg
    
    # Simulate time passing (30 minutes)
    draw_game.locked_players["user2"] = time.time() - 1801
    
    # Should unlock
    success, msg = draw_game.process_chat_guess("user2", "E")
    assert "user2" not in draw_game.locked_players
    assert draw_game.guesses_per_player.get("user2", 0) == 1

def test_global_hint_logic(draw_game: DrawGameManager):
    draw_game.word = "TEST"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    
    assert draw_game.incorrect_guess_count == 0
    assert len(draw_game.revealed_indices) == 0
    
    # 3 wrong guesses from user2
    draw_game.process_chat_guess("user2", "WRONG0")
    draw_game.process_chat_guess("user2", "WRONG1")
    draw_game.process_chat_guess("user2", "WRONG2")
    
    # 2 wrong guesses from user3
    draw_game.process_chat_guess("user3", "WRONG3")
    draw_game.process_chat_guess("user3", "WRONG4")
        
    assert draw_game.incorrect_guess_count == 5
    assert len(draw_game.revealed_indices) == 0
    
    # user2 is locked
    assert "user2" in draw_game.locked_players
    
    # 6th wrong guess triggers hint (from user3)
    draw_game.process_chat_guess("user3", "WRONG5")
    
    assert draw_game.incorrect_guess_count == 0
    assert len(draw_game.revealed_indices) == 1
    assert "user2" not in draw_game.locked_players
    assert "user3" not in draw_game.locked_players

def test_drawer_scoring_logic(draw_game: DrawGameManager):
    draw_game.word = "TEST"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.players["user1"]["score"] = 0
    draw_game.word_difficulty = "easy"  # No bonus
    
    # 1 hint triggered manually
    draw_game.trigger_hint()
    
    # Someone guesses right
    draw_game.process_chat_guess("user2", "TEST")
    
    # Drawer score should be 2 (base) + 0 (easy bonus) = 2
    assert draw_game.players["user1"]["score"] == 2
    
    # Another person guesses right
    draw_game.process_chat_guess("user3", "TEST")
    
    # Drawer score should NOT increase again
    assert draw_game.players["user1"]["score"] == 2

def test_correct_guess_locks_chat(draw_game: DrawGameManager):
    draw_game.word = "TEST"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    
    # User 2 guesses correctly
    success, _ = draw_game.process_chat_guess("user2", "TEST")
    assert success is True
    assert "user2" in draw_game.correct_guessers
    
    # User 2 tries to guess/chat again
    success, msg = draw_game.process_chat_guess("user2", "HELLO")
    assert success is False
    assert "Du har redan gissat rätt" in msg
    
    # Verify the message wasn't added to the normal chat log
    # (The chat log should only contain the system broadcast of the correct guess, not "HELLO")
    messages = [m['text'] for m in draw_game.chat_log]
    assert not any("HELLO" in text for text in messages)

def test_difficulty_bonus_easy(draw_game: DrawGameManager):
    draw_game.word = "TEST"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.players["user1"]["score"] = 0
    draw_game.word_difficulty = "easy"
    
    draw_game.process_chat_guess("user2", "TEST")
    
    # Easy: base 3 + bonus 0 = 3
    assert draw_game.players["user1"]["score"] == 3

def test_difficulty_bonus_medium(draw_game: DrawGameManager):
    draw_game.word = "TEST"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.players["user1"]["score"] = 0
    draw_game.word_difficulty = "medium"
    
    draw_game.process_chat_guess("user2", "TEST")
    
    # Medium: base 3 + bonus 1 = 4
    assert draw_game.players["user1"]["score"] == 4

def test_difficulty_bonus_hard(draw_game: DrawGameManager):
    draw_game.word = "TEST"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.players["user1"]["score"] = 0
    draw_game.word_difficulty = "hard"
    
    draw_game.process_chat_guess("user2", "TEST")
    
    # Hard: base 3 + bonus 2 = 5
    assert draw_game.players["user1"]["score"] == 5

def test_difficulty_bonus_with_hints(draw_game: DrawGameManager):
    draw_game.word = "TEST"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.players["user1"]["score"] = 0
    draw_game.word_difficulty = "hard"
    
    # Trigger 1 hint
    draw_game.trigger_hint()
    
    draw_game.process_chat_guess("user2", "TEST")
    
    # Hard with 1 hint: base 2 + bonus 2 = 4
    assert draw_game.players["user1"]["score"] == 4
