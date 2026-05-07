from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class GrindLogUpsert(BaseModel):
    date: str
    leetcode_easy: Optional[int] = 0
    leetcode_medium: Optional[int] = 0
    leetcode_hard: Optional[int] = 0
    applications: Optional[int] = 0
    screentime_hours: Optional[float] = None
    notes: Optional[str] = None


class GrindLogOut(BaseModel):
    id: int
    date: date
    leetcode_easy: int
    leetcode_medium: int
    leetcode_hard: int
    applications: int
    screentime_hours: Optional[float] = None
    notes: Optional[str] = None


class GymExerciseWithStatus(BaseModel):
    id: int
    name: str
    category: str
    sort_order: int
    completed_today: bool


class GymToggle(BaseModel):
    exercise_id: int
    date: str
    completed: bool


class GymExerciseCreate(BaseModel):
    name: str
    category: str
    sort_order: Optional[int] = 0


class GymExerciseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    sort_order: Optional[int] = None


class GymExerciseRow(BaseModel):
    id: int
    name: str
    category: str
    sort_order: int
    is_active: bool


class LeetCodeProblemCreate(BaseModel):
    date: str
    problem_number: int
    problem_name: str
    difficulty: str  # 'easy' | 'medium' | 'hard'


class LeetCodeProblemOut(BaseModel):
    id: int
    date: date
    problem_number: int
    problem_name: str
    difficulty: str
    created_at: datetime


class AwsTopic(BaseModel):
    id: int
    category: str
    name: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    sort_order: int


class AwsTopicUpdate(BaseModel):
    is_completed: bool
