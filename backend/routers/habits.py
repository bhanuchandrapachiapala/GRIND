from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date as date_cls, datetime
from auth_dep import verify_token
from database import supabase
from models.habit import (
    HabitCreate,
    HabitUpdate,
    HabitOut,
    CompletionOut,
    DailyCompletionSummary,
    HabitCompletionToggle,
)

router = APIRouter(dependencies=[Depends(verify_token)])


def _category_from_time(time_str: str) -> str:
    hour = int(time_str.split(":")[0])
    if 5 <= hour < 12:
        return "morning"
    if 12 <= hour < 17:
        return "afternoon"
    if 17 <= hour < 21:
        return "evening"
    return "night"


def _normalize_time(t: Optional[str]) -> Optional[str]:
    if t is None:
        return None
    parts = t.split(":")
    if len(parts) >= 2:
        return f"{int(parts[0]):02d}:{int(parts[1]):02d}"
    return t


def _row_to_habit(row: dict) -> HabitOut:
    return HabitOut(
        id=row["id"],
        name=row["name"],
        scheduled_time=_normalize_time(row["scheduled_time"]) or "00:00",
        category=row["category"],
        is_active=row["is_active"],
        is_paused=bool(row.get("is_paused") or False),
        sort_order=row["sort_order"],
        created_at=row["created_at"],
    )


@router.get("", response_model=List[HabitOut])
def list_habits(include_paused: bool = Query(default=False)):
    query = (
        supabase.table("habits")
        .select("*")
        .eq("is_active", True)
    )
    if not include_paused:
        query = query.eq("is_paused", False)
    res = (
        query.order("sort_order", desc=False)
        .order("scheduled_time", desc=False)
        .execute()
    )
    return [_row_to_habit(r) for r in (res.data or [])]


@router.post("", response_model=HabitOut)
def create_habit(payload: HabitCreate):
    time_norm = _normalize_time(payload.scheduled_time) or "00:00"
    category = payload.category or _category_from_time(time_norm)

    # Compute next sort_order
    last = (
        supabase.table("habits")
        .select("sort_order")
        .order("sort_order", desc=True)
        .limit(1)
        .execute()
    )
    next_order = ((last.data[0]["sort_order"] if last.data else 0) or 0) + 1

    res = (
        supabase.table("habits")
        .insert(
            {
                "name": payload.name,
                "scheduled_time": f"{time_norm}:00",
                "category": category,
                "is_active": True,
                "sort_order": next_order,
            }
        )
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create habit")
    return _row_to_habit(res.data[0])


@router.put("/{habit_id}", response_model=HabitOut)
def update_habit(habit_id: int, payload: HabitUpdate):
    update_data: dict = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.scheduled_time is not None:
        norm = _normalize_time(payload.scheduled_time)
        update_data["scheduled_time"] = f"{norm}:00"
    if payload.category is not None:
        update_data["category"] = payload.category
    elif payload.scheduled_time is not None:
        update_data["category"] = _category_from_time(payload.scheduled_time)
    if payload.is_paused is not None:
        update_data["is_paused"] = payload.is_paused
    if payload.sort_order is not None:
        update_data["sort_order"] = payload.sort_order

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    res = supabase.table("habits").update(update_data).eq("id", habit_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Habit not found")
    return _row_to_habit(res.data[0])


@router.delete("/{habit_id}")
def delete_habit(habit_id: int):
    res = (
        supabase.table("habits")
        .update({"is_active": False})
        .eq("id", habit_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Habit not found")
    return {"success": True}


@router.get("/completions", response_model=List[CompletionOut])
def list_completions(date: Optional[str] = Query(default=None)):
    target_date = date or date_cls.today().isoformat()
    res = (
        supabase.table("habit_completions")
        .select("id, habit_id, date, completed_at, habits(name)")
        .eq("date", target_date)
        .execute()
    )
    out: List[CompletionOut] = []
    for r in res.data or []:
        habit_obj = r.get("habits") or {}
        out.append(
            CompletionOut(
                id=r["id"],
                habit_id=r["habit_id"],
                habit_name=habit_obj.get("name", ""),
                date=r["date"],
                completed_at=r["completed_at"],
            )
        )
    return out


@router.post("/completions")
def toggle_completion(payload: HabitCompletionToggle):
    if payload.completed:
        # Upsert
        existing = (
            supabase.table("habit_completions")
            .select("id")
            .eq("habit_id", payload.habit_id)
            .eq("date", payload.date)
            .execute()
        )
        if existing.data:
            return {"success": True, "completed": True}
        supabase.table("habit_completions").insert(
            {
                "habit_id": payload.habit_id,
                "date": payload.date,
                "completed_at": datetime.utcnow().isoformat(),
            }
        ).execute()
        return {"success": True, "completed": True}
    else:
        supabase.table("habit_completions").delete().eq(
            "habit_id", payload.habit_id
        ).eq("date", payload.date).execute()
        return {"success": True, "completed": False}


@router.get("/completions/range", response_model=List[DailyCompletionSummary])
def completions_range(
    start_date: str = Query(...),
    end_date: str = Query(...),
):
    # Total active, non-paused habits — paused habits are excluded from %
    habits_res = (
        supabase.table("habits")
        .select("id")
        .eq("is_active", True)
        .eq("is_paused", False)
        .execute()
    )
    total_habits = len(habits_res.data or [])

    completions_res = (
        supabase.table("habit_completions")
        .select("date")
        .gte("date", start_date)
        .lte("date", end_date)
        .execute()
    )

    counts: dict[str, int] = {}
    for r in completions_res.data or []:
        d = r["date"]
        counts[d] = counts.get(d, 0) + 1

    out: List[DailyCompletionSummary] = []
    for d, count in sorted(counts.items()):
        pct = (count / total_habits * 100) if total_habits > 0 else 0.0
        out.append(
            DailyCompletionSummary(
                date=d,
                total_completed=count,
                total_habits=total_habits,
                pct=round(pct, 2),
            )
        )
    return out
