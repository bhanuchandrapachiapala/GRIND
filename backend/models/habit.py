from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class HabitCreate(BaseModel):
    name: str
    scheduled_time: str  # "HH:MM" format
    category: Optional[str] = None


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    scheduled_time: Optional[str] = None
    category: Optional[str] = None
    is_paused: Optional[bool] = None
    sort_order: Optional[int] = None


class HabitOut(BaseModel):
    id: int
    name: str
    scheduled_time: str
    category: str
    is_active: bool
    is_paused: bool = False
    sort_order: int
    created_at: datetime


class CompletionOut(BaseModel):
    id: int
    habit_id: int
    habit_name: str
    date: date
    completed_at: datetime


class DailyCompletionSummary(BaseModel):
    date: date
    total_completed: int
    total_habits: int
    pct: float


class HabitCompletionToggle(BaseModel):
    habit_id: int
    date: str
    completed: bool
