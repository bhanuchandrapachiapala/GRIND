from pydantic import BaseModel
from datetime import date, datetime


class DailyNoteUpsert(BaseModel):
    date: str
    note: str = ""
    mood: str = "neutral"


class DailyNoteOut(BaseModel):
    id: int
    date: date
    note: str
    mood: str
    created_at: datetime
    updated_at: datetime
