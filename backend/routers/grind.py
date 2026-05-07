from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date as date_cls, datetime
from auth_dep import verify_token
from database import supabase
from models.grind import (
    GrindLogUpsert,
    GrindLogOut,
    GymExerciseWithStatus,
    GymToggle,
    GymExerciseCreate,
    GymExerciseUpdate,
    GymExerciseRow,
    AwsTopic,
    AwsTopicUpdate,
    LeetCodeProblemCreate,
    LeetCodeProblemOut,
)

VALID_GYM_CATEGORIES = {"cardio", "strength", "core", "supplement"}
VALID_DIFFICULTIES = {"easy", "medium", "hard"}
MAX_PROBLEM_NAME_LEN = 200

router = APIRouter(dependencies=[Depends(verify_token)])


def _row_to_log(row: dict) -> GrindLogOut:
    return GrindLogOut(
        id=row["id"],
        date=row["date"],
        leetcode_easy=row.get("leetcode_easy") or 0,
        leetcode_medium=row.get("leetcode_medium") or 0,
        leetcode_hard=row.get("leetcode_hard") or 0,
        applications=row.get("applications") or 0,
        screentime_hours=float(row["screentime_hours"]) if row.get("screentime_hours") is not None else None,
        notes=row.get("notes"),
    )


# ─── Grind Log ───────────────────────────────────────────────────────────

@router.get("/log")
def get_log(date: Optional[str] = Query(default=None)) -> Optional[GrindLogOut]:
    target_date = date or date_cls.today().isoformat()
    res = supabase.table("grind_log").select("*").eq("date", target_date).execute()
    if not res.data:
        return None
    return _row_to_log(res.data[0])


@router.post("/log", response_model=GrindLogOut)
def upsert_log(payload: GrindLogUpsert):
    data = {
        "date": payload.date,
        "leetcode_easy": payload.leetcode_easy or 0,
        "leetcode_medium": payload.leetcode_medium or 0,
        "leetcode_hard": payload.leetcode_hard or 0,
        "applications": payload.applications or 0,
    }
    if payload.screentime_hours is not None:
        data["screentime_hours"] = payload.screentime_hours
    if payload.notes is not None:
        data["notes"] = payload.notes

    existing = supabase.table("grind_log").select("id").eq("date", payload.date).execute()
    if existing.data:
        res = (
            supabase.table("grind_log")
            .update(data)
            .eq("date", payload.date)
            .execute()
        )
    else:
        res = supabase.table("grind_log").insert(data).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to upsert grind log")
    return _row_to_log(res.data[0])


@router.get("/log/range", response_model=List[GrindLogOut])
def log_range(start_date: str = Query(...), end_date: str = Query(...)):
    res = (
        supabase.table("grind_log")
        .select("*")
        .gte("date", start_date)
        .lte("date", end_date)
        .order("date", desc=False)
        .execute()
    )
    return [_row_to_log(r) for r in (res.data or [])]


# ─── Gym ─────────────────────────────────────────────────────────────────

@router.get("/gym", response_model=List[GymExerciseWithStatus])
def gym_list():
    today = date_cls.today().isoformat()
    ex_res = (
        supabase.table("gym_exercises")
        .select("*")
        .eq("is_active", True)
        .order("sort_order", desc=False)
        .execute()
    )
    exercises = ex_res.data or []
    if not exercises:
        return []

    completion_res = (
        supabase.table("gym_completions")
        .select("exercise_id")
        .eq("date", today)
        .execute()
    )
    completed_ids = {r["exercise_id"] for r in (completion_res.data or [])}

    return [
        GymExerciseWithStatus(
            id=e["id"],
            name=e["name"],
            category=e["category"],
            sort_order=e["sort_order"],
            completed_today=e["id"] in completed_ids,
        )
        for e in exercises
    ]


@router.post("/gym/toggle")
def gym_toggle(payload: GymToggle):
    if payload.completed:
        existing = (
            supabase.table("gym_completions")
            .select("id")
            .eq("exercise_id", payload.exercise_id)
            .eq("date", payload.date)
            .execute()
        )
        if existing.data:
            return {"success": True, "completed": True}
        supabase.table("gym_completions").insert(
            {
                "exercise_id": payload.exercise_id,
                "date": payload.date,
                "completed_at": datetime.utcnow().isoformat(),
            }
        ).execute()
        return {"success": True, "completed": True}
    else:
        supabase.table("gym_completions").delete().eq(
            "exercise_id", payload.exercise_id
        ).eq("date", payload.date).execute()
        return {"success": True, "completed": False}


@router.get("/gym/history")
def gym_history(start_date: str = Query(...), end_date: str = Query(...)):
    res = (
        supabase.table("gym_completions")
        .select("date, exercise_id, gym_exercises(name)")
        .gte("date", start_date)
        .lte("date", end_date)
        .order("date", desc=False)
        .execute()
    )
    grouped: dict[str, list] = {}
    for r in res.data or []:
        d = r["date"]
        ex = r.get("gym_exercises") or {}
        grouped.setdefault(d, []).append(
            {"exercise_id": r["exercise_id"], "exercise_name": ex.get("name", "")}
        )
    return [{"date": d, "completions": comps} for d, comps in sorted(grouped.items())]


@router.post("/gym/exercises", response_model=GymExerciseRow)
def create_exercise(payload: GymExerciseCreate):
    if payload.category not in VALID_GYM_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    sort_order = payload.sort_order
    if sort_order is None:
        last = (
            supabase.table("gym_exercises")
            .select("sort_order")
            .order("sort_order", desc=True)
            .limit(1)
            .execute()
        )
        sort_order = ((last.data[0]["sort_order"] if last.data else 0) or 0) + 1

    res = (
        supabase.table("gym_exercises")
        .insert(
            {
                "name": payload.name.strip(),
                "category": payload.category,
                "sort_order": sort_order,
                "is_active": True,
            }
        )
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create exercise")
    return GymExerciseRow(**res.data[0])


@router.put("/gym/exercises/{exercise_id}", response_model=GymExerciseRow)
def update_exercise(exercise_id: int, payload: GymExerciseUpdate):
    update_data: dict = {}
    if payload.name is not None:
        if not payload.name.strip():
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        update_data["name"] = payload.name.strip()
    if payload.category is not None:
        if payload.category not in VALID_GYM_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid category")
        update_data["category"] = payload.category
    if payload.sort_order is not None:
        update_data["sort_order"] = payload.sort_order

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    res = (
        supabase.table("gym_exercises")
        .update(update_data)
        .eq("id", exercise_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return GymExerciseRow(**res.data[0])


@router.delete("/gym/exercises/{exercise_id}")
def delete_exercise(exercise_id: int):
    res = (
        supabase.table("gym_exercises")
        .delete()
        .eq("id", exercise_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return {"success": True}


# ─── LeetCode Problem Log ────────────────────────────────────────────────

@router.get("/leetcode/problems", response_model=List[LeetCodeProblemOut])
def list_problems_for_date(date: Optional[str] = Query(default=None)):
    target = date or date_cls.today().isoformat()
    res = (
        supabase.table("leetcode_problems")
        .select("*")
        .eq("date", target)
        .order("problem_number", desc=False)
        .execute()
    )
    return [LeetCodeProblemOut(**r) for r in (res.data or [])]


@router.get("/leetcode/problems/all", response_model=List[LeetCodeProblemOut])
def list_all_problems():
    res = (
        supabase.table("leetcode_problems")
        .select("*")
        .order("date", desc=True)
        .order("problem_number", desc=False)
        .execute()
    )
    return [LeetCodeProblemOut(**r) for r in (res.data or [])]


@router.post("/leetcode/problems", response_model=LeetCodeProblemOut)
def create_problem(payload: LeetCodeProblemCreate):
    if payload.difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(status_code=400, detail="Invalid difficulty")
    if not (1 <= payload.problem_number <= 9999):
        raise HTTPException(status_code=400, detail="Problem number must be 1-9999")
    name = (payload.problem_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Problem name is required")
    if len(name) > MAX_PROBLEM_NAME_LEN:
        raise HTTPException(status_code=400, detail=f"Problem name exceeds {MAX_PROBLEM_NAME_LEN} characters")

    existing = (
        supabase.table("leetcode_problems")
        .select("id")
        .eq("date", payload.date)
        .eq("problem_number", payload.problem_number)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail=f"Problem #{payload.problem_number} already logged today",
        )

    res = (
        supabase.table("leetcode_problems")
        .insert(
            {
                "date": payload.date,
                "problem_number": payload.problem_number,
                "problem_name": name,
                "difficulty": payload.difficulty,
            }
        )
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to log problem")
    return LeetCodeProblemOut(**res.data[0])


@router.delete("/leetcode/problems/{problem_id}")
def delete_problem(problem_id: int):
    res = (
        supabase.table("leetcode_problems")
        .delete()
        .eq("id", problem_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"success": True}


# ─── AWS Topics ──────────────────────────────────────────────────────────

@router.get("/aws", response_model=List[AwsTopic])
def aws_list():
    res = (
        supabase.table("aws_topics")
        .select("*")
        .order("sort_order", desc=False)
        .execute()
    )
    return [AwsTopic(**r) for r in (res.data or [])]


@router.put("/aws/{topic_id}", response_model=AwsTopic)
def aws_toggle(topic_id: int, payload: AwsTopicUpdate):
    update_data = {
        "is_completed": payload.is_completed,
        "completed_at": datetime.utcnow().isoformat() if payload.is_completed else None,
    }
    res = (
        supabase.table("aws_topics")
        .update(update_data)
        .eq("id", topic_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Topic not found")
    return AwsTopic(**res.data[0])
