import socketio
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .services.game_service import game_lobby, MAX_GAMES_PER_USER
from .services.draw_service import draw_game_lobby
from .services.auth_service import AuthManager
from .routers import auth, user, admin
import os

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("main")

# Create Socket.IO server (Async)
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    task = asyncio.create_task(cleanup_task())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(title="Ostrich Games API", lifespan=lifespan)

# Mount Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://ostrich-games.vercel.app",
        "https://ostrich-games.se",
        "https://www.ostrich-games.se",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Background Cleanup Task ---
async def cleanup_task():
    """Background task that runs every hour to prune inactive resources."""
    while True:
        await asyncio.sleep(3600)  # Run every hour
        logger.info("Starting scheduled resource pruning...")
        try:
            # Prune inactive games (30 days) from memory
            removed_games = game_lobby.cleanup_inactive_games(max_idle_days=30)
            
            # Prune session cache
            AuthManager.cleanup_session_cache()
            
            if removed_games > 0:
                logger.info("Successfully removed %d inactive games.", removed_games)
        except Exception as e:
            logger.error("Error in background task: %s", e)

# Removed old on_event startup handler


# --- Base Route for Health Checks ---
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {"status": "ok", "message": "Ostrich Games API is running"}

# --- REST API Routers ---
@app.get("/api/draw/random-words")
def get_random_draw_words():
    from backend.data.draw_words import DRAW_WORDS
    import random
    
    words = []
    # Try to pick one from each category
    if "easy" in DRAW_WORDS and DRAW_WORDS["easy"]:
        words.append(random.choice(DRAW_WORDS["easy"]).upper())
    if "medium" in DRAW_WORDS and DRAW_WORDS["medium"]:
        words.append(random.choice(DRAW_WORDS["medium"]).upper())
    if "hard" in DRAW_WORDS and DRAW_WORDS["hard"]:
        words.append(random.choice(DRAW_WORDS["hard"]).upper())
        
    # Fallback if categories are empty
    if len(words) < 3:
        from backend.services.game_service import _valid_words_list
        if _valid_words_list:
            fallback = random.sample(_valid_words_list, min(3 - len(words), len(_valid_words_list)))
            words.extend(fallback)
        else:
            words.extend(["KATT", "HUND", "BIL"])
            
    return {"words": words[:3]}

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(admin.router)

# --- Socket.IO Events ---

@sio.event
async def connect(sid, environ, auth=None):
    logger.info("Socket connected: sid=%s, auth=%s", sid, auth)
    user = None
    if auth and 'token' in auth:
        token = auth['token']
        user = AuthManager.get_user_by_token(token)
        if user:
            logger.info("Authenticated user: %s (%s)", user['username'], user['id'])
            # Store user info in session
            await sio.save_session(sid, {'user': user})
            return True # Indicate successful authentication
    
    logger.info("Anonymous connection: sid=%s", sid)
    return True # Allow anonymous connections for now


@sio.event
async def join_game(sid, data):
    logger.info("join_game: sid=%s, data=%s", sid, data)
    try:
        game_id = data.get('gameId', 'global')
        session = await sio.get_session(sid)
        user = session.get('user')
        
        if user:
            uuid = user['id']
            name = user['username']
        else:
            uuid = data.get('sessionId')
            name = data.get('playerName')

        if uuid and name:
            is_new_game = game_id not in game_lobby.games and game_id not in draw_game_lobby.games
            if user and is_new_game:
                current_game_count = game_lobby.count_games_for_user(uuid)
                if current_game_count >= MAX_GAMES_PER_USER:
                    return {
                        'status': 'error',
                        'message': f'Du har redan {current_game_count} aktiva spel. Max {MAX_GAMES_PER_USER} spel per användare.'
                    }
            
            await sio.enter_room(sid, game_id)
            lobby = draw_game_lobby if game_id.lower().startswith('draw_') else game_lobby
            game = lobby.get_game(game_id)
            game.add_player(uuid, name, sid)
            lobby.register_player_game(uuid, game_id)
            
            if user:
                AuthManager.add_game_to_user(uuid, game_id)

            state = game.get_state_for_frontend()
            await sio.emit('update_game', state, room=game_id)
            return {"success": True, "game_id": game_id, "state": state}
        else:
            return {"success": False, "error": "Missing uuid or name"}
    except Exception as e:
        logger.error("Error in join_game: %s", e)
        return {"success": False, "error": str(e)}

@sio.event
async def guess_letter(sid, data):
    game_id = data.get('gameId', 'global')
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    letter = data.get('letter')
    if uuid and letter:
        game = game_lobby.get_game(game_id)
        game.process_guess(uuid, letter)
        await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)

@sio.event
async def chat_guess(sid, data):
    game_id = data.get('gameId')
    if not game_id or not game_id.lower().startswith('draw_'): return
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    text = data.get('text')
    if uuid and text:
        game = draw_game_lobby.get_game(game_id)
        is_correct, private_msg = game.process_chat_guess(uuid, text)
        await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)
        if private_msg:
            await sio.emit('notification', private_msg, room=sid)

@sio.event
async def submit_word(sid, data):
    game_id = data.get('gameId', 'global')
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    word = data.get('word')
    if uuid and word:
        lobby = draw_game_lobby if game_id.lower().startswith('draw_') else game_lobby
        game = lobby.get_game(game_id)
        success, message = await game.choose_word(uuid, word)
        if not success:
            await sio.emit('error', message, room=sid)
        else:
            await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)

@sio.event
async def reset_game(sid, data):
    game_id = data.get('gameId', 'global')
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    if uuid:
        lobby = draw_game_lobby if game_id.lower().startswith('draw_') else game_lobby
        game = lobby.get_game(game_id)
        game.start_new_round(uuid)
        await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)

@sio.event
async def cancel_start(sid, data):
    game_id = data.get('gameId', 'global')
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    if uuid:
        lobby = draw_game_lobby if game_id.lower().startswith('draw_') else game_lobby
        game = lobby.get_game(game_id)
        game.cancel_start_game(uuid)
        await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)

@sio.event
async def force_reset(sid, data):
    game_id = data.get('gameId', 'global')
    lobby = draw_game_lobby if game_id.lower().startswith('draw_') else game_lobby
    game = lobby.get_game(game_id)
    if game.chooser_timed_out:
        game.force_cancel_choosing()
        await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)
    elif hasattr(game, 'check_time_up') and game.check_time_up():
        await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)

@sio.event
async def disconnect(sid):
    for game_id, game in game_lobby.games.items():
        game.remove_player_by_sid(sid)
        await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)
    for game_id, game in draw_game_lobby.games.items():
        game.remove_player_by_sid(sid)
        await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)

@sio.event
async def draw_line(sid, data):
    game_id = data.get('gameId')
    if not game_id or not game_id.lower().startswith('draw_'): return
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    if uuid:
        game = draw_game_lobby.get_game(game_id)
        game.add_line(uuid, data.get('line'))
        await sio.emit('draw_line_update', data.get('line'), room=game_id, skip_sid=sid)

@sio.event
async def undo_line(sid, data):
    game_id = data.get('gameId')
    if not game_id or not game_id.lower().startswith('draw_'): return
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    
    if uuid:
        game = draw_game_lobby.get_game(game_id)
        if game:
            success = game.undo_line(uuid)
            if success:
                await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)

@sio.event
async def clear_canvas(sid, data):
    game_id = data.get('gameId')
    if not game_id or not game_id.lower().startswith('draw_'): return
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    if uuid:
        game = draw_game_lobby.get_game(game_id)
        game.clear_canvas(uuid)
        await sio.emit('clear_canvas_update', room=game_id)

@sio.event
async def abandon_draw_game(sid, data):
    game_id = data.get('gameId')
    if not game_id or not game_id.lower().startswith('draw_'): return
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    if uuid:
        game = draw_game_lobby.get_game(game_id)
        success, message = game.abandon_round(uuid)
        if not success:
            await sio.emit('error', message, room=sid)
        else:
            await sio.emit('update_game', game.get_state_for_frontend(), room=game_id)

@sio.event
async def get_secret_word(sid, data):
    game_id = data.get('gameId', 'global')
    session = await sio.get_session(sid)
    user = session.get('user')
    uuid = user['id'] if user else data.get('sessionId')
    if not uuid: return
    lobby = draw_game_lobby if game_id.lower().startswith('draw_') else game_lobby
    game = lobby.get_game(game_id)
    allowed = False
    if game.chooser_id == uuid:
        allowed = True
    elif hasattr(game, 'correct_guessers') and uuid in game.correct_guessers:
        allowed = True
    elif hasattr(game, 'winner_id') and game.winner_id:
        allowed = True
    if allowed:
        await sio.emit('secret_word', {'word': game.word}, room=sid)
