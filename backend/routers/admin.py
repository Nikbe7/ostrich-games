from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from ..schemas import AdminLoginRequest
from ..services.auth_service import AuthManager
from ..services.game_service import game_lobby, get_all_valid_words, add_valid_word, remove_valid_word
from ..core.supabase import supabase
import os
import secrets

router = APIRouter(prefix="/api/admin", tags=["admin"])

_admin_tokens = set()

def verify_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    if token not in _admin_tokens:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return token

@router.post("/login")
async def login(request: AdminLoginRequest):
    expected_password = os.environ.get("ADMIN_PASSWORD")
    if not expected_password:
        raise HTTPException(status_code=500, detail="ADMIN_PASSWORD is not set on the server")
    if request.password != expected_password:
        raise HTTPException(status_code=401, detail="Incorrect admin password")
    
    token = "ADMIN_" + secrets.token_urlsafe(32)
    _admin_tokens.add(token)
    return {"success": True, "token": token}

@router.get("/users")
async def list_users(_=Depends(verify_admin)):
    try:
        response = supabase.table("app_users").select("id, username, created_at, games").execute()
        return {"success": True, "users": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@router.delete("/users/{username}")
async def remove_user(username: str, _=Depends(verify_admin)):
    try:
        response = supabase.table("app_users").select("id").eq("username", username).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        user_id = response.data[0]["id"]
        supabase.table("app_users").delete().eq("id", user_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to delete user")

@router.post("/users/{username}/reset-games")
async def reset_games(username: str, _=Depends(verify_admin)):
    try:
        response = supabase.table("app_users").select("id").eq("username", username).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        user_id = response.data[0]["id"]
        supabase.table("app_users").update({"games": []}).eq("id", user_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to reset games")

@router.post("/games/clear-all")
async def clear_all_games(_=Depends(verify_admin)):
    try:
        supabase.table("app_games").delete().neq("id", "placeholder").execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to clear all games")

@router.post("/users/{username}/generate-reset-link")
async def generate_reset_link(username: str, _=Depends(verify_admin)):
    token = AuthManager.generate_password_reset_token(username)
    if not token:
        raise HTTPException(status_code=404, detail="User not found or failed to generate token")
    return {"success": True, "reset_token": token}

# --- Words Management ---

class AddWordRequest(BaseModel):
    word: str

@router.get("/words")
async def list_words(_=Depends(verify_admin)):
    return {"success": True, "words": get_all_valid_words()}

@router.post("/words")
async def add_word(req: AddWordRequest, _=Depends(verify_admin)):
    if add_valid_word(req.word):
        return {"success": True}
    raise HTTPException(status_code=400, detail="Failed to add word or word already exists")

@router.delete("/words/{word}")
async def remove_word(word: str, _=Depends(verify_admin)):
    if remove_valid_word(word):
        return {"success": True}
    raise HTTPException(status_code=400, detail="Failed to remove word")

# --- System Status ---

@router.get("/system")
async def system_status(_=Depends(verify_admin)):
    return {"success": True, "stats": game_lobby.get_system_stats()}

# --- Advanced User Management ---

class RenameUserRequest(BaseModel):
    new_username: str

@router.put("/users/{username}/rename")
async def rename_user(username: str, req: RenameUserRequest, _=Depends(verify_admin)):
    try:
        new_name = req.new_username.strip()
        if len(new_name) < 3:
            raise HTTPException(status_code=400, detail="Username too short")
            
        # Check if new username exists
        existing = supabase.table("app_users").select("id").ilike("username", new_name).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Username already taken")
            
        # Find target user
        user = supabase.table("app_users").select("id").eq("username", username).execute()
        if not user.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        supabase.table("app_users").update({"username": new_name}).eq("id", user.data[0]["id"]).execute()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{username}/stats")
async def user_stats(username: str, _=Depends(verify_admin)):
    try:
        user = supabase.table("app_users").select("id, games").eq("username", username).execute()
        if not user.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        user_id = user.data[0]["id"]
        game_ids = user.data[0]["games"] or []
        
        if not game_ids:
            return {"success": True, "stats": {"wins": 0, "losses": 0, "total_games": 0}}
            
        games_res = supabase.table("app_games").select("state").in_("id", game_ids).execute()
        
        wins = 0
        losses = 0
        for game in games_res.data:
            state = game.get("state", {})
            status = state.get("status")
            winner = state.get("winnerId")
            
            if status == "finished":
                if winner == user_id:
                    wins += 1
                else:
                    losses += 1
                    
        return {
            "success": True, 
            "stats": {
                "wins": wins, 
                "losses": losses, 
                "total_games": len(game_ids)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
