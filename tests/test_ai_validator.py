"""
Tests for backend/ai_validator.py
Covers: no API key, rate limit exceeded, JA/NEJ/unexpected responses, exception handling.
Updated to test the Interactions API (httpx) implementation.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import backend.ai_validator as ai_mod


def _make_interaction_response(answer_text, status_code=200):
    """Helper to create a mock httpx response matching the Interactions API format."""
    mock_response = MagicMock()
    mock_response.status_code = status_code
    if status_code == 200 and answer_text is not None:
        mock_response.json.return_value = {
            "id": "v1_test",
            "status": "completed",
            "steps": [
                {"signature": "test_sig", "type": "thought"},
                {"content": [{"text": answer_text, "type": "text"}], "type": "model_output"},
            ],
            "model": "gemini-3.1-flash-lite-preview",
        }
    elif status_code == 200 and answer_text is None:
        # Empty response (no model_output steps)
        mock_response.json.return_value = {
            "id": "v1_test",
            "status": "completed",
            "steps": [{"signature": "test_sig", "type": "thought"}],
            "model": "gemini-3.1-flash-lite-preview",
        }
    else:
        mock_response.text = f"Error {status_code}"
    return mock_response


@pytest.mark.asyncio
async def test_validate_word_no_client():
    """If no Gemini API key is configured, should return False."""
    with patch.object(ai_mod, 'GEMINI_API_KEY', None):
        result = await ai_mod.validate_word_with_ai("HUND")
    assert result is False


@pytest.mark.asyncio
async def test_validate_word_rate_limited():
    """Should return 'RATE_LIMITED' when limiter rejects the request."""
    mock_limiter = MagicMock()
    mock_limiter.consume = AsyncMock(return_value=False)

    with patch.object(ai_mod, 'GEMINI_API_KEY', 'fake-key'), \
         patch.object(ai_mod, 'ai_limiter', mock_limiter):
        result = await ai_mod.validate_word_with_ai("HUND")

    assert result == "RATE_LIMITED"


@pytest.mark.asyncio
async def test_validate_word_returns_ja():
    """Should return True when AI responds with JA."""
    mock_limiter = MagicMock()
    mock_limiter.consume = AsyncMock(return_value=True)

    mock_http_client = AsyncMock()
    mock_http_client.post = AsyncMock(return_value=_make_interaction_response("JA"))
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)

    with patch.object(ai_mod, 'GEMINI_API_KEY', 'fake-key'), \
         patch.object(ai_mod, 'ai_limiter', mock_limiter), \
         patch('backend.ai_validator.httpx.AsyncClient', return_value=mock_http_client):
        result = await ai_mod.validate_word_with_ai("HUND")

    assert result is True


@pytest.mark.asyncio
async def test_validate_word_returns_nej():
    """Should return False when AI responds with NEJ."""
    mock_limiter = MagicMock()
    mock_limiter.consume = AsyncMock(return_value=True)

    mock_http_client = AsyncMock()
    mock_http_client.post = AsyncMock(return_value=_make_interaction_response("NEJ"))
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)

    with patch.object(ai_mod, 'GEMINI_API_KEY', 'fake-key'), \
         patch.object(ai_mod, 'ai_limiter', mock_limiter), \
         patch('backend.ai_validator.httpx.AsyncClient', return_value=mock_http_client):
        result = await ai_mod.validate_word_with_ai("FLURP")

    assert result is False


@pytest.mark.asyncio
async def test_validate_word_unexpected_response():
    """Should return False when AI returns something other than JA or NEJ."""
    mock_limiter = MagicMock()
    mock_limiter.consume = AsyncMock(return_value=True)

    mock_http_client = AsyncMock()
    mock_http_client.post = AsyncMock(return_value=_make_interaction_response("KANSKE"))
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)

    with patch.object(ai_mod, 'GEMINI_API_KEY', 'fake-key'), \
         patch.object(ai_mod, 'ai_limiter', mock_limiter), \
         patch('backend.ai_validator.httpx.AsyncClient', return_value=mock_http_client):
        result = await ai_mod.validate_word_with_ai("OKLART")

    assert result is False


@pytest.mark.asyncio
async def test_validate_word_empty_response():
    """Should return False when AI returns no model_output."""
    mock_limiter = MagicMock()
    mock_limiter.consume = AsyncMock(return_value=True)

    mock_http_client = AsyncMock()
    mock_http_client.post = AsyncMock(return_value=_make_interaction_response(None))
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)

    with patch.object(ai_mod, 'GEMINI_API_KEY', 'fake-key'), \
         patch.object(ai_mod, 'ai_limiter', mock_limiter), \
         patch('backend.ai_validator.httpx.AsyncClient', return_value=mock_http_client):
        result = await ai_mod.validate_word_with_ai("TOM")

    assert result is False


@pytest.mark.asyncio
async def test_validate_word_api_quota_exception():
    """Should return 'RATE_LIMITED' when a 429 response is returned."""
    mock_limiter = MagicMock()
    mock_limiter.consume = AsyncMock(return_value=True)

    mock_http_client = AsyncMock()
    mock_http_client.post = AsyncMock(return_value=_make_interaction_response(None, status_code=429))
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)

    with patch.object(ai_mod, 'GEMINI_API_KEY', 'fake-key'), \
         patch.object(ai_mod, 'ai_limiter', mock_limiter), \
         patch('backend.ai_validator.httpx.AsyncClient', return_value=mock_http_client):
        result = await ai_mod.validate_word_with_ai("KAT")

    assert result == "RATE_LIMITED"


@pytest.mark.asyncio
async def test_validate_word_general_exception():
    """Should return False for unexpected exceptions."""
    mock_limiter = MagicMock()
    mock_limiter.consume = AsyncMock(return_value=True)

    mock_http_client = AsyncMock()
    mock_http_client.post = AsyncMock(side_effect=Exception("Network error"))
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)

    with patch.object(ai_mod, 'GEMINI_API_KEY', 'fake-key'), \
         patch.object(ai_mod, 'ai_limiter', mock_limiter), \
         patch('backend.ai_validator.httpx.AsyncClient', return_value=mock_http_client):
        result = await ai_mod.validate_word_with_ai("NAGON")

    assert result is False
