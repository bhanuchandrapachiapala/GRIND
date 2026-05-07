from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from auth_dep import verify_token
from database import supabase
from models.settings import SettingUpdate

router = APIRouter(dependencies=[Depends(verify_token)])


@router.get("")
def get_settings():
    res = supabase.table("settings").select("*").execute()
    return {row["key"]: row["value"] for row in (res.data or [])}


@router.put("/{key}")
def update_setting(key: str, payload: SettingUpdate):
    existing = supabase.table("settings").select("key").eq("key", key).execute()
    if existing.data:
        res = (
            supabase.table("settings")
            .update({"value": payload.value, "updated_at": datetime.utcnow().isoformat()})
            .eq("key", key)
            .execute()
        )
    else:
        res = supabase.table("settings").insert(
            {"key": key, "value": payload.value}
        ).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to update setting")
    return {"key": key, "value": payload.value}
