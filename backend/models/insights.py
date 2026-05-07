from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date


class HabitChange(BaseModel):
    habit_id: int
    name: str
    this_week_pct: float
    last_week_pct: float
    change: float


class WeeklyReviewOut(BaseModel):
    week_start: date
    week_end: date
    this_week_avg_pct: float
    last_week_avg_pct: float
    pct_change: float
    best_day: Optional[Dict[str, Any]] = None
    worst_day: Optional[Dict[str, Any]] = None
    most_improved_habits: List[HabitChange]
    most_dropped_habits: List[HabitChange]
    streak_at_end_of_week: int
    total_leetcode: int
    total_applications: int
    gym_sessions: int
