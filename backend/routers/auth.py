from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

VALID_USERNAME = "Bhanu"
VALID_PASSWORD = "Bhanu123"
AUTH_TOKEN = "grind_auth_token"


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(req: LoginRequest):
    if req.username == VALID_USERNAME and req.password == VALID_PASSWORD:
        return {"success": True, "token": AUTH_TOKEN}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")


@router.post("/logout")
def logout():
    return {"success": True}
