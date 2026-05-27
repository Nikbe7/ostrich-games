import sys

with open('backend/main.py', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if '@sio.event' in line and 'async def join_game' in "".join(lines[i:i+3]):
        skip = True
    
    if not skip:
        if line.strip() == 'app.include_router(auth.router)':
            new_lines.extend([
                '@app.get("/api/draw/random-words")\n',
                'def get_random_draw_words():\n',
                '    from backend.services.game_service import _valid_words_list\n',
                '    import random\n',
                '    if not _valid_words_list:\n',
                '        return {"words": ["KATT", "HUND", "BIL"]}\n',
                '    words = random.sample(_valid_words_list, min(3, len(_valid_words_list)))\n',
                '    return {"words": words}\n\n',
                line
            ])
        else:
            new_lines.append(line)

socket_handlers = """
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
async def check_draw_hint(sid, data):
    import time
    game_id = data.get('gameId')
    if not game_id or not game_id.lower().startswith('draw_'): return
    game = draw_game_lobby.get_game(game_id)
    if game.status == 'drawing' and game.last_hint_at:
        if time.time() - game.last_hint_at >= 3600:
            if game.trigger_hint('tid'):
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
        await sio.emit('secret_word', game.word, room=sid)
"""

with open('backend/main.py', 'w') as f:
    f.writelines(new_lines)
    f.write(socket_handlers)
