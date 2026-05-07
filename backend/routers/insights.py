from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Optional
from datetime import date as date_cls, timedelta, datetime
from auth_dep import verify_token
from database import supabase
from models.insights import HabitChange, WeeklyReviewOut

router = APIRouter(dependencies=[Depends(verify_token)])


def _get_streak_threshold() -> int:
    res = supabase.table("settings").select("value").eq("key", "streak_threshold").execute()
    if res.data:
        try:
            return int(res.data[0]["value"])
        except (ValueError, TypeError):
            return 70
    return 70


def _active_habits_count() -> int:
    res = (
        supabase.table("habits")
        .select("id")
        .eq("is_active", True)
        .eq("is_paused", False)
        .execute()
    )
    return len(res.data or [])


def _completions_by_date(start: str, end: str) -> Dict[str, int]:
    res = (
        supabase.table("habit_completions")
        .select("date")
        .gte("date", start)
        .lte("date", end)
        .execute()
    )
    counts: Dict[str, int] = {}
    for r in res.data or []:
        d = r["date"]
        counts[d] = counts.get(d, 0) + 1
    return counts


@router.get("/streak")
def streak_info():
    threshold = _get_streak_threshold()
    total = _active_habits_count()
    today = date_cls.today()

    # Today's pct
    today_str = today.isoformat()
    today_counts = _completions_by_date(today_str, today_str)
    today_completed = today_counts.get(today_str, 0)
    today_pct = (today_completed / total * 100) if total > 0 else 0.0

    # Pull last 365 days
    start = (today - timedelta(days=365)).isoformat()
    counts = _completions_by_date(start, today_str)

    # Current streak
    current_streak = 0
    cur = today
    while True:
        d_str = cur.isoformat()
        c = counts.get(d_str, 0)
        pct = (c / total * 100) if total > 0 else 0.0
        if pct >= threshold:
            current_streak += 1
            cur = cur - timedelta(days=1)
        else:
            break

    # Longest streak in the window
    longest = 0
    running = 0
    for i in range(366):
        d = today - timedelta(days=i)
        d_str = d.isoformat()
        c = counts.get(d_str, 0)
        pct = (c / total * 100) if total > 0 else 0.0
        if pct >= threshold:
            running += 1
            if running > longest:
                longest = running
        else:
            running = 0

    return {
        "current_streak": current_streak,
        "longest_streak": max(longest, current_streak),
        "streak_threshold": threshold,
        "today_pct": round(today_pct, 2),
    }


@router.get("/top-habits")
def top_habits():
    today = date_cls.today()
    start = (today - timedelta(days=30)).isoformat()
    end = today.isoformat()

    habits_res = (
        supabase.table("habits")
        .select("id, name, created_at")
        .eq("is_active", True)
        .eq("is_paused", False)
        .execute()
    )
    habits = habits_res.data or []

    completion_res = (
        supabase.table("habit_completions")
        .select("habit_id, date")
        .gte("date", start)
        .lte("date", end)
        .execute()
    )
    by_habit: Dict[int, int] = {}
    for r in completion_res.data or []:
        hid = r["habit_id"]
        by_habit[hid] = by_habit.get(hid, 0) + 1

    ranks = []
    for h in habits:
        # days active = min(30, days since created_at)
        try:
            created = datetime.fromisoformat(h["created_at"].replace("Z", "+00:00"))
            days_since = (datetime.now(created.tzinfo) - created).days + 1
        except Exception:
            days_since = 30
        total_days = max(1, min(30, days_since))
        completed = by_habit.get(h["id"], 0)
        rate = round((completed / total_days) * 100, 2)
        ranks.append(
            {
                "habit_id": h["id"],
                "name": h["name"],
                "completion_rate": rate,
                "total_days": total_days,
                "completed_days": completed,
            }
        )

    ranks_sorted = sorted(ranks, key=lambda x: x["completion_rate"], reverse=True)
    top5 = ranks_sorted[:5]
    bottom5 = sorted(ranks_sorted[-5:], key=lambda x: x["completion_rate"])
    return {"top5": top5, "bottom5": bottom5}


@router.get("/weekly-trend")
def weekly_trend():
    today = date_cls.today()
    start = today - timedelta(days=27)
    total = _active_habits_count()
    counts = _completions_by_date(start.isoformat(), today.isoformat())

    out = []
    for i in range(28):
        d = start + timedelta(days=i)
        d_str = d.isoformat()
        c = counts.get(d_str, 0)
        pct = round((c / total * 100), 2) if total > 0 else 0.0
        out.append({"date": d_str, "pct": pct, "completed": c, "total": total})
    return out


@router.get("/day-of-week")
def day_of_week():
    today = date_cls.today()
    start = today - timedelta(days=89)
    total = _active_habits_count()
    counts = _completions_by_date(start.isoformat(), today.isoformat())

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    sums = [0.0] * 7
    days_n = [0] * 7
    for i in range(90):
        d = start + timedelta(days=i)
        idx = d.weekday()  # 0 = Monday
        c = counts.get(d.isoformat(), 0)
        pct = (c / total * 100) if total > 0 else 0.0
        sums[idx] += pct
        days_n[idx] += 1

    return [
        {"day_name": day_names[i], "avg_pct": round(sums[i] / days_n[i], 2) if days_n[i] else 0.0}
        for i in range(7)
    ]


@router.get("/consistency")
def consistency():
    threshold = _get_streak_threshold()
    today = date_cls.today()
    start = today - timedelta(days=89)

    habits_res = (
        supabase.table("habits")
        .select("id, name, created_at")
        .eq("is_active", True)
        .eq("is_paused", False)
        .execute()
    )
    habits = habits_res.data or []

    completion_res = (
        supabase.table("habit_completions")
        .select("habit_id, date")
        .gte("date", start.isoformat())
        .lte("date", today.isoformat())
        .execute()
    )
    by_habit_dates: Dict[int, set] = {}
    for r in completion_res.data or []:
        by_habit_dates.setdefault(r["habit_id"], set()).add(r["date"])

    out = []
    for h in habits:
        dates = by_habit_dates.get(h["id"], set())
        try:
            created = datetime.fromisoformat(h["created_at"].replace("Z", "+00:00"))
            days_since = (datetime.now(created.tzinfo) - created).days + 1
        except Exception:
            days_since = 90
        total_days = max(1, min(90, days_since))
        rate = round((len(dates) / total_days) * 100, 2)

        # Current streak (going back from today)
        current = 0
        cur = today
        while cur.isoformat() in dates:
            current += 1
            cur = cur - timedelta(days=1)

        # Best streak in the 90-day window
        best = 0
        running = 0
        for i in range(90):
            d = start + timedelta(days=i)
            if d.isoformat() in dates:
                running += 1
                if running > best:
                    best = running
            else:
                running = 0
        best = max(best, current)

        out.append(
            {
                "habit_id": h["id"],
                "name": h["name"],
                "total_completed": len(dates),
                "completion_rate": rate,
                "current_streak": current,
                "best_streak": best,
            }
        )

    out.sort(key=lambda x: x["completion_rate"], reverse=True)
    _ = threshold  # not used directly here
    return out


@router.get("/leetcode")
def leetcode_insights():
    today = date_cls.today()
    start = today - timedelta(days=29)

    totals_res = (
        supabase.table("grind_log")
        .select("leetcode_easy, leetcode_medium, leetcode_hard")
        .execute()
    )
    total_easy = sum((r.get("leetcode_easy") or 0) for r in totals_res.data or [])
    total_medium = sum((r.get("leetcode_medium") or 0) for r in totals_res.data or [])
    total_hard = sum((r.get("leetcode_hard") or 0) for r in totals_res.data or [])

    daily_res = (
        supabase.table("grind_log")
        .select("date, leetcode_easy, leetcode_medium, leetcode_hard")
        .gte("date", start.isoformat())
        .lte("date", today.isoformat())
        .order("date", desc=False)
        .execute()
    )
    by_date = {r["date"]: r for r in (daily_res.data or [])}

    daily = []
    for i in range(30):
        d = start + timedelta(days=i)
        d_str = d.isoformat()
        row = by_date.get(d_str)
        daily.append(
            {
                "date": d_str,
                "easy": (row.get("leetcode_easy") if row else 0) or 0,
                "medium": (row.get("leetcode_medium") if row else 0) or 0,
                "hard": (row.get("leetcode_hard") if row else 0) or 0,
            }
        )

    return {
        "total_easy": total_easy,
        "total_medium": total_medium,
        "total_hard": total_hard,
        "total_all": total_easy + total_medium + total_hard,
        "daily": daily,
    }


@router.get("/gym")
def gym_insights():
    today = date_cls.today()
    start = today - timedelta(days=29)

    ex_res = (
        supabase.table("gym_exercises")
        .select("id, name, category")
        .eq("is_active", True)
        .order("sort_order", desc=False)
        .execute()
    )
    exercises = {e["id"]: e for e in (ex_res.data or [])}

    comp_res = (
        supabase.table("gym_completions")
        .select("exercise_id")
        .gte("date", start.isoformat())
        .lte("date", today.isoformat())
        .execute()
    )
    counts: Dict[int, int] = {}
    for r in comp_res.data or []:
        eid = r["exercise_id"]
        counts[eid] = counts.get(eid, 0) + 1

    out = []
    for eid, ex in exercises.items():
        out.append(
            {
                "exercise_name": ex["name"],
                "category": ex["category"],
                "count": counts.get(eid, 0),
            }
        )
    out.sort(key=lambda x: x["count"], reverse=True)
    return out


# ─── Weekly Review ───────────────────────────────────────────────────────

def _completion_pct_for_day(d_str: str, completions_by_date: Dict[str, int], total: int) -> float:
    if total <= 0:
        return 0.0
    return (completions_by_date.get(d_str, 0) / total) * 100.0


def _streak_at_date(end_date: date_cls, threshold: int, total: int) -> int:
    if total <= 0:
        return 0
    start = (end_date - timedelta(days=365)).isoformat()
    counts = _completions_by_date(start, end_date.isoformat())
    streak = 0
    cur = end_date
    while True:
        d_str = cur.isoformat()
        pct = (counts.get(d_str, 0) / total * 100) if total > 0 else 0.0
        if pct >= threshold:
            streak += 1
            cur = cur - timedelta(days=1)
        else:
            break
    return streak


@router.get("/weekly-review", response_model=WeeklyReviewOut)
def weekly_review(week_start: str = Query(...)):
    try:
        ws = date_cls.fromisoformat(week_start)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid week_start (expected YYYY-MM-DD)")

    week_end = ws + timedelta(days=6)
    last_ws = ws - timedelta(days=7)
    last_we = ws - timedelta(days=1)

    threshold = _get_streak_threshold()
    total = _active_habits_count()

    this_counts = _completions_by_date(ws.isoformat(), week_end.isoformat())
    last_counts = _completions_by_date(last_ws.isoformat(), last_we.isoformat())

    this_pcts: List[float] = []
    best: Optional[tuple] = None
    worst: Optional[tuple] = None
    for i in range(7):
        d = ws + timedelta(days=i)
        pct = _completion_pct_for_day(d.isoformat(), this_counts, total)
        this_pcts.append(pct)
        if best is None or pct > best[1]:
            best = (d.isoformat(), pct)
        if worst is None or pct < worst[1]:
            worst = (d.isoformat(), pct)

    last_pcts = [
        _completion_pct_for_day((last_ws + timedelta(days=i)).isoformat(), last_counts, total)
        for i in range(7)
    ]

    this_avg = round(sum(this_pcts) / 7, 2)
    last_avg = round(sum(last_pcts) / 7, 2)
    pct_change = round(this_avg - last_avg, 2)

    # Per-habit completion rates this week vs last week (active, non-paused)
    habits_res = (
        supabase.table("habits")
        .select("id, name")
        .eq("is_active", True)
        .eq("is_paused", False)
        .execute()
    )
    habits = habits_res.data or []

    def _habit_counts(start_d: str, end_d: str) -> Dict[int, int]:
        rs = (
            supabase.table("habit_completions")
            .select("habit_id, date")
            .gte("date", start_d)
            .lte("date", end_d)
            .execute()
        )
        out: Dict[int, int] = {}
        for r in rs.data or []:
            hid = r["habit_id"]
            out[hid] = out.get(hid, 0) + 1
        return out

    this_habit_counts = _habit_counts(ws.isoformat(), week_end.isoformat())
    last_habit_counts = _habit_counts(last_ws.isoformat(), last_we.isoformat())

    changes: List[HabitChange] = []
    for h in habits:
        this_pct = round((this_habit_counts.get(h["id"], 0) / 7) * 100, 2)
        last_pct = round((last_habit_counts.get(h["id"], 0) / 7) * 100, 2)
        changes.append(
            HabitChange(
                habit_id=h["id"],
                name=h["name"],
                this_week_pct=this_pct,
                last_week_pct=last_pct,
                change=round(this_pct - last_pct, 2),
            )
        )

    most_improved = sorted(changes, key=lambda c: c.change, reverse=True)[:3]
    most_dropped = [c for c in sorted(changes, key=lambda c: c.change) if c.change < 0][:3]

    streak_at_end = _streak_at_date(week_end, threshold, total)

    # Grind stats for the week
    grind_res = (
        supabase.table("grind_log")
        .select("leetcode_easy, leetcode_medium, leetcode_hard, applications")
        .gte("date", ws.isoformat())
        .lte("date", week_end.isoformat())
        .execute()
    )
    total_lc = 0
    total_apps = 0
    for r in grind_res.data or []:
        total_lc += (r.get("leetcode_easy") or 0) + (r.get("leetcode_medium") or 0) + (r.get("leetcode_hard") or 0)
        total_apps += r.get("applications") or 0

    gym_res = (
        supabase.table("gym_completions")
        .select("date")
        .gte("date", ws.isoformat())
        .lte("date", week_end.isoformat())
        .execute()
    )
    gym_dates = {r["date"] for r in (gym_res.data or [])}

    return WeeklyReviewOut(
        week_start=ws,
        week_end=week_end,
        this_week_avg_pct=this_avg,
        last_week_avg_pct=last_avg,
        pct_change=pct_change,
        best_day={"date": best[0], "pct": round(best[1], 2)} if best else None,
        worst_day={"date": worst[0], "pct": round(worst[1], 2)} if worst else None,
        most_improved_habits=most_improved,
        most_dropped_habits=most_dropped,
        streak_at_end_of_week=streak_at_end,
        total_leetcode=total_lc,
        total_applications=total_apps,
        gym_sessions=len(gym_dates),
    )
