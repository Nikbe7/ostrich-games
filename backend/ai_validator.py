import os
import asyncio
import time
from typing import Union
import httpx
import logging
import re
from typing import Tuple

logger = logging.getLogger("ai_validator")

def is_valid_word_format(word: str) -> Tuple[bool, str]:
    """Validerar ordets struktur innan vi frågar AI."""
    word_upper = word.upper().strip()
    
    if len(word_upper) < 2:
        return False, "Ordet är för kort (minst 2 bokstäver)."
        
    if len(word_upper) > 20:
        return False, "Ordet är för långt (max 20 bokstäver)."
        
    if not word_upper.isalpha():
        return False, "Ordet får bara innehålla bokstäver (inga siffror eller mellanslag)."
        
    # Check for 3 or more identical consecutive letters (e.g. "AAA")
    if re.search(r'(.)\1\1', word_upper):
        return False, "Ordet innehåller tre eller fler likadana bokstäver i rad."
        
    # Check for "QWERTY" and other common keyboard mashes
    mashes = ["QWERTY", "ASDFG", "ZXCVB", "LALALA", "HAHA", "HIHI"]
    for m in mashes:
        if m in word_upper:
            return False, "Ordet ser ut som skräp eller spam."
            
    return True, ""

# Gemini Interactions API configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.1-flash-lite-preview"
INTERACTIONS_API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment. AI Word Validation will be disabled.")

class AIRateLimiter:
    """
    Simple token-bucket rate limiter for AI requests.
    Default: 10 requests per minute with a burst of 5.
    """
    def __init__(self, requests_per_minute: int = 10, burst: int = 5):
        self.capacity = burst
        self.tokens = float(burst)
        self.refill_rate = requests_per_minute / 60.0  # tokens per second
        self.last_refill = time.time()
        self.lock = asyncio.Lock()

    async def consume(self) -> bool:
        async with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            self.tokens = min(float(self.capacity), float(self.tokens + elapsed * self.refill_rate))
            self.last_refill = now

            if self.tokens >= 1.0:
                self.tokens -= 1.0
                return True
            else:
                return False

# Global instance of the rate limiter
ai_limiter = AIRateLimiter()

async def validate_word_with_ai(word: str) -> Union[bool, str]:
    """
    Checks if a given word is a valid Swedish word according to Gemini.
    Uses the Gemini Interactions API (replaces deprecated generateContent).
    Returns True if valid, False if invalid, or "RATE_LIMITED" if quota exceeded.
    """
    if not GEMINI_API_KEY:
        return False

    # Check rate limit first
    if not await ai_limiter.consume():
        logger.warning("AI Rate Limit exceeded for word '%s'", word)
        return "RATE_LIMITED"
        
    prompt = (
        f"Du är en extremt strikt domare över det svenska språket, med Svenska Akademiens ordlista (SAOL) som främsta riktmärke. "
        f"Din uppgift är att avgöra om ordet '{word.upper()}' är ett giltigt svenskt ord (grundform eller vanlig böjning). "
        f"VIKTIGT: Ordet måste tillhöra och användas i det svenska språket. "
        f"Etablerade lånord som numera anses vara svenska (t.ex. 'SKATEBOARD', 'HACKER', 'JEANS', 'WEEKEND') ÄR GILTIGA och ska godkännas. "
        f"Däremot ska rent engelska ord som INTE är etablerade i svenskan (t.ex. 'COMPUTER', 'AWESOME', 'BEAUTIFUL') avvisas och få NEJ. "
        f"Slang som bara används i trånga kretsar, påhittade ord och rena egennamn (förnamn, städer, länder) ska också avvisas. "
        f"Svara ENBART med ordet 'JA' eller 'NEJ'. Förklara ingenting, skriv inga andra tecken."
    )
    
    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": GEMINI_MODEL,
        "input": prompt,
    }
    
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                INTERACTIONS_API_URL,
                headers=headers,
                json=payload,
                timeout=15.0,
            )
        
        if response.status_code == 429:
            logger.warning("AI Rate Limit (Gemini API 429) hit for word '%s'", word)
            return "RATE_LIMITED"
            
        if response.status_code != 200:
            logger.error("Interactions API error %d for word '%s': %s", response.status_code, word, response.text[:300])
            return False
        
        data = response.json()
        
        # Extract the model_output text from the interaction steps
        answer_text = ""
        for step in data.get("steps", []):
            if step.get("type") == "model_output":
                for content_block in step.get("content", []):
                    if content_block.get("type") == "text":
                        answer_text += content_block.get("text", "")
        
        if not answer_text:
            return False

        answer = answer_text.strip().upper()
        # Clean out any punctuation
        answer = "".join(c for c in answer if c.isalpha())
        
        if answer == "JA":
            return True
        elif answer == "NEJ":
            return False
        else:
            logger.warning("AI Validator returned unexpected response: '%s' for word '%s'", answer_text, word)
            return False
            
    except Exception as e:
        error_msg = str(e).upper()
        if "429" in error_msg or "QUOTA" in error_msg or "EXHAUSTED" in error_msg:
            logger.warning("AI Rate Limit (Gemini API 429) hit: %s", e)
            return "RATE_LIMITED"
            
        logger.error("AI Validator error: %s", e)
        return False
