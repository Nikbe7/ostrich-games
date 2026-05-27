import pytest
import time
from unittest.mock import patch, MagicMock
from backend.services.draw_service import DrawGameManager

@pytest.fixture
def draw_game():
    import uuid
    game_id = f"test_extended_{uuid.uuid4()}"
    game = DrawGameManager(game_id)
    # Don't mock save_to_db yet because we want to test it
    game.add_player("user1", "Alice", "sid1")
    game.add_player("user2", "Bob", "sid2")
    return game

@pytest.mark.asyncio
async def test_choose_word(draw_game: DrawGameManager):
    draw_game.status = "choosing"
    draw_game.chooser_id = "user1"
    draw_game.save_to_db = MagicMock()
    
    # Not chooser
    success, msg = await draw_game.choose_word("user2", "TEST")
    assert not success
    assert "din tur" in msg
    
    # Wrong status
    draw_game.status = "drawing"
    success, msg = await draw_game.choose_word("user1", "TEST")
    assert not success
    assert "väntar inte" in msg
    
    draw_game.status = "choosing"
    
    # Invalid format
    with patch('backend.ai_validator.is_valid_word_format', return_value=(False, "Ogiltigt format")):
        success, msg = await draw_game.choose_word("user1", "T E S T")
        assert not success
        assert "Ogiltigt format" in msg
        
    # Valid word locally
    with patch('backend.ai_validator.is_valid_word_format', return_value=(True, "")):
        with patch('backend.services.draw_service._valid_words_set', {"KATT"}):
            success, msg = await draw_game.choose_word("user1", "KATT")
            assert success
            assert draw_game.word == "KATT"
            assert draw_game.status == "drawing"
            assert draw_game.word_difficulty == "easy" # KATT is easy
            
@pytest.mark.asyncio
async def test_choose_word_ai_validator(draw_game: DrawGameManager):
    draw_game.status = "choosing"
    draw_game.chooser_id = "user1"
    draw_game.save_to_db = MagicMock()
    
    with patch('backend.ai_validator.is_valid_word_format', return_value=(True, "")):
        with patch('backend.services.draw_service._valid_words_set', set()):
            # Mock AI validator
            with patch('backend.ai_validator.validate_word_with_ai', return_value=True):
                # Also mock supabase to prevent actual insert
                with patch('backend.services.draw_service.supabase') as mock_supa:
                    success, msg = await draw_game.choose_word("user1", "AINEWWORD")
                    assert success
                    assert draw_game.word == "AINEWWORD"
                    assert draw_game.word_difficulty == "medium" # default
                    
            # AI rejects
            draw_game.status = "choosing"
            with patch('backend.ai_validator.validate_word_with_ai', return_value=False):
                success, msg = await draw_game.choose_word("user1", "BADWORD")
                assert not success
                assert "godkändes inte" in msg

def test_save_and_load_db(draw_game: DrawGameManager):
    # Setup some state
    draw_game.word = "TEST"
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.chat_log = [{"text": "hello"}]
    
    # Mock supabase upsert
    mock_supabase = MagicMock()
    
    with patch('backend.services.draw_service.supabase', mock_supabase):
        draw_game.save_to_db()
        assert mock_supabase.table().upsert.called
        
        # Test load
        mock_supabase.table().select().eq().execute.return_value = MagicMock(
            data=[{"state": {"real_word": "TEST", "status": "drawing", "wordChooser": "user1", "chatLog": [{"text": "hello"}]}}]
        )
        loaded_game = DrawGameManager.load_from_db("some_id")
        assert loaded_game.word == "TEST"
        assert loaded_game.status == "drawing"
        assert loaded_game.chooser_id == "user1"
        assert len(loaded_game.chat_log) == 1

def test_get_state_for_frontend(draw_game: DrawGameManager):
    draw_game.word = "KATT"
    draw_game.status = "drawing"
    draw_game.drawing_started_at = time.time()
    draw_game.chooser_id = "user1"
    draw_game.save_to_db = MagicMock()
    
    # By default no hints revealed, word should be masked
    state = draw_game.get_state_for_frontend()
    assert state['word'] == "____"
    assert state['wordChooser'] == "user1"
    
    # Reveal index 0
    draw_game.revealed_indices = [0]
    state = draw_game.get_state_for_frontend()
    assert state['word'] == "K___"
    
    # Choosing state
    draw_game.status = "choosing"
    state = draw_game.get_state_for_frontend()
    assert state['word'] == "VÄLJER..."

def test_drawing_actions(draw_game: DrawGameManager):
    draw_game.save_to_db = MagicMock()
    draw_game.status = "drawing"
    draw_game.chooser_id = "user1"
    draw_game.drawing_started_at = time.time()
    
    # Only chooser can add lines
    draw_game.add_line("user2", {"x": 10})
    assert len(draw_game.lines) == 0
    
    draw_game.add_line("user1", {"x": 10})
    assert len(draw_game.lines) == 1
    
    # Only chooser can clear
    draw_game.clear_canvas("user2")
    assert len(draw_game.lines) == 1
    
    draw_game.clear_canvas("user1")
    assert len(draw_game.lines) == 0
    
    # Not in drawing state
    draw_game.status = "choosing"
    draw_game.add_line("user1", {"x": 10})
    assert len(draw_game.lines) == 0

