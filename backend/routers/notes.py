from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date as date_cls, datetime
from auth_dep import verify_token
from database import supabase
from models.notes import DailyNoteUpsert, DailyNoteOut

router = APIRouter(dependencies=[Depends(verify_token)])

VALID_MOODS = {"great", "good", "neutral", "tough", "bad"}
MAX_NOTE_LEN = 500


def _row_to_note(row: dict) -> DailyNoteOut:
    return DailyNoteOut(
        id=row["id"],
        date=row["date"],
        note=row.get("note") or "",
        mood=row.get("mood") or "neutral",
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("")
def get_note(date: Optional[str] = Query(default=None)) -> Optional[DailyNoteOut]:
    target = date or date_cls.today().isoformat()
    res = supabase.table("daily_notes").select("*").eq("date", target).execute()
    if not res.data:
        return None
    return _row_to_note(res.data[0])


@router.post("", response_model=DailyNoteOut)
def upsert_note(payload: DailyNoteUpsert):
    if payload.mood not in VALID_MOODS:
        raise HTTPException(status_code=400, detail="Invalid mood")
    if len(payload.note) > MAX_NOTE_LEN:
        raise HTTPException(status_code=400, detail=f"Note exceeds {MAX_NOTE_LEN} characters")

    existing = (
        supabase.table("daily_notes").select("id").eq("date", payload.date).execute()
    )
    data = {
        "date": payload.date,
        "note": payload.note,
        "mood": payload.mood,
    }
    if existing.data:
        data["updated_at"] = datetime.utcnow().isoformat()
        res = (
            supabase.table("daily_notes")
            .update(data)
            .eq("date", payload.date)
            .execute()
        )
    else:
        res = supabase.table("daily_notes").insert(data).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save note")
    return _row_to_note(res.data[0])


@router.get("/range", response_model=List[DailyNoteOut])
def note_range(
    start_date: str = Query(...),
    end_date: str = Query(...),
):
    res = (
        supabase.table("daily_notes")
        .select("*")
        .gte("date", start_date)
        .lte("date", end_date)
        .order("date", desc=True)
        .execute()
    )
    return [_row_to_note(r) for r in (res.data or [])]
