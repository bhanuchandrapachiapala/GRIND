# SCHEMA_UPGRADES.md — GRIND v2 Feature Additions
## Incremental Specification for Claude Code

> **Purpose**: This file defines all new features to add on top of the existing GRIND application built from SCHEMA.md. Read SCHEMA.md first for full context. Then apply every change in this file exactly as specified. Do not remove or break any existing functionality.

---

## TABLE OF CONTENTS

1. [Overview of Changes](#1-overview-of-changes)
2. [Database Changes](#2-database-changes)
3. [Backend Changes](#3-backend-changes)
4. [Frontend Changes](#4-frontend-changes)
5. [Component Specifications](#5-component-specifications)
6. [Business Logic](#6-business-logic)
7. [SQL Migration](#7-sql-migration)
8. [Claude Code Prompt](#8-claude-code-prompt)

---

## 1. OVERVIEW OF CHANGES

| # | Feature | Scope |
|---|---------|-------|
| 1 | Daily Note / Journal | New DB table, new API route, Home page widget, Insights timeline tab |
| 2 | PWA Push Notifications | Service worker upgrade, new settings fields, notification scheduler |
| 3 | Weekly Review Screen | New API endpoint, new modal component, auto-show on Sundays |
| 4 | Missed Day Recovery | Home page conditional button, existing completions endpoints |
| 5 | LeetCode Problem Log | New DB table, new API routes, new UI in Grind tab |
| 6 | Dark/Light Theme Toggle | Settings page slider, CSS variable swap, localStorage persistence |
| 7 | Drag-and-Drop Habit Reorder | New frontend library, reorder UI on Tasks page, existing PUT endpoint |
| 8 | Habit Pause | New DB column, UI toggle on Tasks page, filter from daily % calc |

---

## 2. DATABASE CHANGES

### 2.1 New Table: `daily_notes`

**Purpose**: One short free-text note per day — mood, wins, blockers. Kept intentionally minimal.

```sql
CREATE TABLE IF NOT EXISTS daily_notes (
  id          BIGSERIAL    PRIMARY KEY,
  date        DATE         NOT NULL UNIQUE,
  note        TEXT         NOT NULL DEFAULT '',
  mood        TEXT         NOT NULL DEFAULT 'neutral',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_mood CHECK (
    mood IN ('great', 'good', 'neutral', 'tough', 'bad')
  )
);

CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON daily_notes(date DESC);
```

**Column definitions**:

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `date` | DATE | One row per calendar day (UNIQUE) |
| `note` | TEXT | Free text, max 500 chars enforced at app layer |
| `mood` | TEXT | One of: `great`, `good`, `neutral`, `tough`, `bad` |
| `created_at` | TIMESTAMPTZ | Row created |
| `updated_at` | TIMESTAMPTZ | Last updated (auto-trigger) |

---

### 2.2 New Table: `leetcode_problems`

**Purpose**: Log individual LeetCode problems solved — problem number, name, difficulty. Simple personal history.

```sql
CREATE TABLE IF NOT EXISTS leetcode_problems (
  id            BIGSERIAL    PRIMARY KEY,
  date          DATE         NOT NULL,
  problem_number INTEGER     NOT NULL,
  problem_name  TEXT         NOT NULL,
  difficulty    TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_difficulty CHECK (
    difficulty IN ('easy', 'medium', 'hard')
  ),
  CONSTRAINT unique_problem_per_day UNIQUE (date, problem_number)
);

CREATE INDEX IF NOT EXISTS idx_lc_problems_date       ON leetcode_problems(date DESC);
CREATE INDEX IF NOT EXISTS idx_lc_problems_difficulty ON leetcode_problems(difficulty);
```

**Column definitions**:

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `date` | DATE | Date the problem was solved |
| `problem_number` | INTEGER | LeetCode problem number (e.g. `1`, `42`, `200`) |
| `problem_name` | TEXT | Problem title (e.g. `"Two Sum"`) |
| `difficulty` | TEXT | One of: `easy`, `medium`, `hard` |
| `created_at` | TIMESTAMPTZ | When logged |

---

### 2.3 Alter Table: `habits` — add `is_paused` column

```sql
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT false;
```

**Behavior**:
- `is_paused = true` means the habit is temporarily inactive
- Paused habits do NOT appear in the daily task list on Home page
- Paused habits do NOT count toward the total habit count for streak/completion % calculation
- Paused habits still appear on the Tasks page under a "Paused" section with a "Resume" button
- Paused habits are NOT deleted — `is_active` remains `true`

---

### 2.4 Alter Table: `settings` — add new keys

Insert these new default rows into the `settings` table:

```sql
INSERT INTO settings (key, value) VALUES
  ('theme', 'dark'),
  ('notifications_enabled', 'false'),
  ('notification_lead_minutes', '5')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

| key | default value | description |
|-----|--------------|-------------|
| `theme` | `dark` | `dark` or `light` |
| `notifications_enabled` | `false` | Whether PWA push notifications are on |
| `notification_lead_minutes` | `5` | Minutes before scheduled habit time to send notification |

---

## 3. BACKEND CHANGES

### 3.1 New Router: `routers/notes.py`

All routes require `verify_token`.

**GET `/api/notes`**
- Query param: `date` (defaults to today, format `YYYY-MM-DD`)
- Returns the `daily_notes` row for that date, or `null` if none exists.
- Response: `DailyNoteOut | null`

**POST `/api/notes`**
- Upsert a daily note for the given date.
- Request body: `DailyNoteUpsert { date, note, mood }`
- Uses `INSERT ... ON CONFLICT (date) DO UPDATE`
- Response: `DailyNoteOut`

**GET `/api/notes/range`**
- Query params: `start_date`, `end_date`
- Returns all notes in range ordered by date DESC.
- Used by the Insights journal timeline.
- Response: `List[DailyNoteOut]`

---

### 3.2 New Routes in `routers/grind.py` — LeetCode Problem Log

**GET `/api/grind/leetcode/problems`**
- Query param: `date` (defaults to today)
- Returns all `leetcode_problems` rows for that date ordered by `problem_number ASC`.
- Response: `List[LeetCodeProblemOut]`

**GET `/api/grind/leetcode/problems/all`**
- Returns all problems ever logged, ordered by `date DESC`, then `problem_number ASC`.
- Response: `List[LeetCodeProblemOut]`

**POST `/api/grind/leetcode/problems`**
- Logs a new problem.
- Request body: `LeetCodeProblemCreate { date, problem_number, problem_name, difficulty }`
- Response: `LeetCodeProblemOut`

**DELETE `/api/grind/leetcode/problems/{problem_id}`**
- Hard deletes a problem log entry.
- Response: `{ "success": true }`

---

### 3.3 Updated Routes in `routers/habits.py`

**PUT `/api/habits/{habit_id}`** — already exists, extend to handle `is_paused`:
- Accept `is_paused: Optional[bool]` in `HabitUpdate` model
- When `is_paused` changes, update the column

**GET `/api/habits`** — already exists, extend:
- Add query param `include_paused: bool = false`
- By default (`include_paused=false`): return only habits where `is_active=true AND is_paused=false`
- When `include_paused=true`: return all habits where `is_active=true` (both paused and active)

---

### 3.4 New Route in `routers/insights.py` — Weekly Review

**GET `/api/insights/weekly-review`**
- Query param: `week_start` (Monday date of the week to review, format `YYYY-MM-DD`)
- Calculates for that 7-day window vs the previous 7-day window:
  - `this_week_avg_pct`: average daily completion % this week
  - `last_week_avg_pct`: average daily completion % last week
  - `pct_change`: difference (positive = improved)
  - `best_day`: date + pct of the best day this week
  - `worst_day`: date + pct of the worst day this week
  - `most_improved_habits`: top 3 habits with biggest completion rate improvement vs last week
  - `most_dropped_habits`: top 3 habits with biggest drop vs last week
  - `streak_at_end_of_week`: streak count as of the last day of the week
  - `total_leetcode`: sum of easy+medium+hard for the week
  - `total_applications`: sum of applications for the week
  - `gym_sessions`: number of days with at least 1 gym completion
- Response: `WeeklyReviewOut` (all fields above)

---

### 3.5 New Pydantic Models

#### Add to `models/habit.py`
```python
class HabitUpdate(BaseModel):  # extend existing
    name: Optional[str] = None
    scheduled_time: Optional[str] = None
    category: Optional[str] = None
    is_paused: Optional[bool] = None
```

#### New file `models/notes.py`
```python
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class DailyNoteUpsert(BaseModel):
    date: str
    note: str
    mood: str = 'neutral'

class DailyNoteOut(BaseModel):
    id: int
    date: date
    note: str
    mood: str
    created_at: datetime
    updated_at: datetime
```

#### Add to `models/grind.py`
```python
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
```

#### Add to `models/insights.py` (new file)
```python
from pydantic import BaseModel
from typing import List, Optional
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
    best_day: Optional[dict]
    worst_day: Optional[dict]
    most_improved_habits: List[HabitChange]
    most_dropped_habits: List[HabitChange]
    streak_at_end_of_week: int
    total_leetcode: int
    total_applications: int
    gym_sessions: int
```

---

### 3.6 Register new router in `main.py`

```python
from routers import auth, habits, grind, insights, settings as settings_router, notes

app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
```

---

## 4. FRONTEND CHANGES

### 4.1 New Hook: `useNotes.ts`

```typescript
// useNote(date) — fetches single note for a date
// useNoteRange(start, end) — fetches note list for timeline
// useUpsertNote() — mutation: POST /api/notes, invalidates note queries
```

### 4.2 Updated Hook: `useHabits.ts`

- `useHabits()` — add `includePaused` param, default false
- `usePauseHabit()` — mutation: PUT /api/habits/{id} with `{ is_paused: true }`, invalidates habits
- `useResumeHabit()` — mutation: PUT /api/habits/{id} with `{ is_paused: false }`, invalidates habits

### 4.3 New Hook: `useLeetCodeProblems.ts`

```typescript
// useTodayProblems(date) — GET /api/grind/leetcode/problems?date=
// useAllProblems() — GET /api/grind/leetcode/problems/all
// useAddProblem() — mutation: POST /api/grind/leetcode/problems
// useDeleteProblem() — mutation: DELETE /api/grind/leetcode/problems/{id}
```

### 4.4 New Hook: `useWeeklyReview.ts`

```typescript
// useWeeklyReview(weekStart) — GET /api/insights/weekly-review?week_start=
```

### 4.5 Updated Hook: `useSettings.ts`

- Add `useTheme()` — reads `theme` from settings, returns `'dark' | 'light'`
- Add `useUpdateTheme()` — mutation that updates `theme` setting + immediately applies CSS class to `document.documentElement`

### 4.6 Theme System

Apply theme by toggling a class on `<html>`:
- Dark (default): `document.documentElement.classList.remove('light')`
- Light: `document.documentElement.classList.add('light')`

Add light mode CSS variables to `index.css`:

```css
.light {
  --color-bg-base:        #f0f4ff;
  --color-bg-elevated:    #ffffff;
  --color-bg-glass:       rgba(0, 0, 0, 0.03);
  --color-text-primary:   #0a0f1e;
  --color-text-secondary: #4b5563;
  --color-border:         rgba(0, 100, 200, 0.15);
  --color-border-hover:   rgba(0, 100, 200, 0.35);
}
```

All existing color usages must reference CSS variables (not hardcoded hex) so the theme swap works automatically.

### 4.7 Drag-and-Drop Library

Add `@dnd-kit/core` and `@dnd-kit/sortable` to `package.json`:

```json
"@dnd-kit/core": "^6.1.0",
"@dnd-kit/sortable": "^8.0.0"
```

---

## 5. COMPONENT SPECIFICATIONS

### 5.1 `DailyNoteWidget.tsx` (Home page)

**Location**: On `HomePage.tsx`, placed between `TodayProgress` and `TaskTimeGroup` sections.

**Visual**: A `GlassCard` with:
- Row of 5 mood emoji buttons: 😄 `great` · 🙂 `good` · 😐 `neutral` · 😕 `tough` · 😞 `bad`
- Selected mood button has neon cyan ring glow
- Single `<textarea>` below — placeholder: `"How's today going? Wins, blockers, thoughts..."` — max 500 characters, auto-resize (no fixed height), no scrollbar
- Character counter: `"243 / 500"` shown bottom-right in muted text when typing
- Auto-saves 1 second after the user stops typing (debounced, no save button needed)
- Small `"Saved ✓"` indicator appears briefly after save (Framer Motion fade in/out)

**On load**: Fetches `GET /api/notes?date=today` and pre-fills mood + text if exists.

---

### 5.2 `JournalTimeline.tsx` (Insights tab)

**Location**: New tab called `"Journal"` added to `InsightsPage.tsx` tab bar.

**Visual**: Vertical timeline list. Each entry is a `GlassCard` showing:
- Date (formatted: `"Mon, May 5"`) — left side
- Mood emoji — top right of card
- Note text — body of card, truncated to 3 lines with expand toggle
- If no note for a day, that day is skipped (only days with notes appear)

**Data**: Fetches last 30 days from `GET /api/notes/range`.

---

### 5.3 `WeeklyReviewModal.tsx`

**Trigger**: Automatically shown on Sundays when the user opens the app, if they haven't dismissed it today (track dismissal in `localStorage` key `grind_weekly_review_dismissed_YYYY-MM-DD`). Also accessible from a "Weekly Review" button in `SettingsPage`.

**Visual**: Full-screen bottom sheet (slides up). Dark glassmorphism background.

**Content sections**:
1. **Header**: `"Week of May 1–7"` + close button
2. **Score card**: Two large animated numbers side by side — `"This Week: 74%"` vs `"Last Week: 61%"` with an up/down arrow and delta (`"+13%"` in green or red)
3. **Best / Worst day**: Two small cards showing the date and % for each
4. **Habit changes**: Two lists — "Most Improved" (green up arrows) and "Dropped Off" (red down arrows), 3 items each, showing habit name + change %
5. **Grind stats**: Row of 3 pills — `"🧩 12 LeetCode"`, `"📨 23 Apps"`, `"💪 4 Gym Sessions"`
6. **Streak**: `"🔥 Streak: 8 days"` at end of week
7. **Close button**: `"Got it, let's crush this week"` — full width neon button

---

### 5.4 `MissedDayRecovery.tsx` (Home page)

**Location**: Shown at the very top of `HomePage.tsx`, above the streak ring, only when the condition is met.

**Condition**: Yesterday had zero habit completions (total_completed = 0 for yesterday's date).

**Visual**: Amber/orange `GlassCard` with warning icon:
- Text: `"You didn't log yesterday (May 6). Want to fill it in?"`
- Button: `"Log Yesterday"` — tapping sets a `selectedDate` state on HomePage to yesterday's date, and the task list below switches to show yesterday's habits with checkboxes

**Behavior**:
- When in "yesterday mode", the TopBar shows `"Logging: May 6"` instead of `"Good morning, Bhanu"`
- A `"Back to Today"` button appears to switch back
- Completions are saved with yesterday's date

---

### 5.5 `LeetCodeProblemLogger.tsx` (Grind tab — LeetCode sub-tab)

**Location**: Replace or extend `LeetCodeLogger.tsx` — add a second section below the existing Easy/Medium/Hard number inputs.

**New section header**: `"Problems Solved Today"`

**Add Problem Form** (inline, not a bottom sheet):
- Number input: `"#"` — problem number (integer)
- Text input: `"Problem name"` — problem title
- Difficulty select: Easy (green) / Medium (amber) / Hard (red) — styled pill buttons, not a dropdown
- `"Add"` button — calls POST `/api/grind/leetcode/problems`

**Problems list** (below form):
- Each logged problem shown as a row: `#42 · Trapping Rain Water · Hard`
- Difficulty shown as colored badge
- Trash icon on right to delete (no confirm dialog needed — it's just a log entry)
- Sorted by problem number ASC

**On load**: Fetches today's problems from `GET /api/grind/leetcode/problems?date=today`.

---

### 5.6 `ThemeToggle.tsx` (Settings page)

**Location**: In `SettingsPage.tsx`, first item in the first settings group (above Streak Threshold).

**Visual**: A row with label `"Theme"` on left, and a toggle switch on right with `"Dark"` / `"Light"` labels. The toggle uses Framer Motion for smooth sliding animation. When light mode is active, the toggle slides right and the icon changes from 🌙 to ☀️.

**Behavior**: On toggle, immediately applies the theme class to `document.documentElement` and calls `PUT /api/settings/theme` with the new value. Also persists to `localStorage` key `grind_theme` so it loads instantly on next app open before the API call returns.

On app startup (`main.tsx` or `App.tsx`), read `localStorage.getItem('grind_theme')` and apply the class immediately to avoid flash of wrong theme.

---

### 5.7 Drag-and-Drop Habit Reorder (`TasksPage.tsx`)

**Library**: `@dnd-kit/sortable` — wrap the habit list in `<SortableContext>` with `verticalListSortingStrategy`.

**Each `HabitListItem`**: Add a drag handle icon (`GripVertical` from Lucide) on the left side, visible only in "Reorder" mode.

**Reorder mode**: A `"Reorder"` button in the top-right of `TasksPage` toggles reorder mode on/off. When active, drag handles appear, the edit/delete menu is hidden, and a `"Done"` button appears.

**On drag end**: Call `PUT /api/habits/{id}` for each habit whose `sort_order` changed. Send updates sequentially. Show a brief `"Order saved"` toast.

---

### 5.8 Habit Pause Toggle (`HabitListItem.tsx` + `TasksPage.tsx`)

**In three-dot menu of `HabitListItem`**: Add a third option — `"Pause"` (if currently active) or `"Resume"` (if currently paused). Icon: `PauseCircle` / `PlayCircle` from Lucide.

**On Tasks page**: Add a `"Paused"` section below the active habit list (only visible if any habits are paused). Each paused habit shows with a muted amber color, a `PauseCircle` icon, and a `"Resume"` button inline.

**Visual indicator**: Paused habits on the Tasks page show a small amber `"Paused"` badge next to the habit name.

---

### 5.9 PWA Push Notifications (`public/sw.js`)

Upgrade the service worker to support push notifications:

1. In `sw.js`, add a `push` event listener that shows a notification using `self.registration.showNotification()`.

2. In `SettingsPage.tsx`, when the user enables notifications:
   - Call `Notification.requestPermission()`
   - If granted, register a `PushSubscription` (use VAPID — generate a VAPID key pair and store the public key in `frontend/.env` as `VITE_VAPID_PUBLIC_KEY`)
   - Save subscription to `localStorage` key `grind_push_subscription`

3. In `useHabits.ts`, after fetching habits, schedule `setTimeout` calls for each habit's `scheduled_time` minus `notification_lead_minutes` (from settings). If the time has already passed today, skip it. Use the Page Visibility API to re-schedule when the app is reopened.

4. The notification content: title `"GRIND"`, body `"Time for: {habit name}"`, icon `/favicon.ico`.

> **Note**: Full server-side push (Web Push Protocol) requires a backend push endpoint and VAPID keys. Implement client-side setTimeout-based notifications as the primary method (works when browser tab is open). Add a comment in the code marking where server-side push would be wired in for future implementation.

---

## 6. BUSINESS LOGIC

### 6.1 Paused Habits and Streak Calculation

When calculating daily completion %:
```
pct = (completed habits / total active non-paused habits) * 100
```
Paused habits are excluded from both numerator and denominator. This ensures pausing a habit during a busy week does not hurt your streak.

### 6.2 Daily Note Auto-Save

Debounce the note textarea onChange by 1000ms. After debounce fires, call `POST /api/notes` upsert. Show a brief `"Saved ✓"` Framer Motion fade that appears for 1.5 seconds then fades out.

### 6.3 Weekly Review Auto-Show Logic

On app load, in `App.tsx`:
```typescript
const today = new Date();
const isSunday = today.getDay() === 0;
const dismissedKey = `grind_weekly_review_dismissed_${formatDate(today)}`;
const alreadyDismissed = localStorage.getItem(dismissedKey);
if (isSunday && !alreadyDismissed) {
  // show WeeklyReviewModal
}
```
When user closes the modal, set `localStorage.setItem(dismissedKey, 'true')`.

### 6.4 Missed Day Detection

On `HomePage` load, after fetching today's completions, also fetch yesterday's summary from `GET /api/habits/completions/range` with start=yesterday, end=yesterday. If `total_completed === 0`, show `MissedDayRecovery` banner.

### 6.5 Theme Initialization (no flash)

In `index.html`, add an inline script before the React bundle loads:
```html
<script>
  const theme = localStorage.getItem('grind_theme') || 'dark';
  if (theme === 'light') document.documentElement.classList.add('light');
</script>
```
This prevents flash of dark theme when light mode is active.

### 6.6 LeetCode Problem Number Validation

- `problem_number` must be a positive integer between 1 and 9999
- `problem_name` must be non-empty, max 200 characters
- If a problem number already exists for that date, show inline error: `"Problem #42 already logged today"`

---

## 7. SQL MIGRATION

Save as `supabase/migrations/002_upgrades.sql`. Run in Supabase SQL Editor after `001_initial_schema.sql`.

```sql
-- ══════════════════════════════════════════════════════════════════
-- GRIND v2 — Upgrade Migration
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Add is_paused to habits ──
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_habits_is_paused ON habits(is_paused);

-- ── 2. daily_notes table ──
CREATE TABLE IF NOT EXISTS daily_notes (
  id          BIGSERIAL    PRIMARY KEY,
  date        DATE         NOT NULL UNIQUE,
  note        TEXT         NOT NULL DEFAULT '',
  mood        TEXT         NOT NULL DEFAULT 'neutral',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_mood CHECK (
    mood IN ('great', 'good', 'neutral', 'tough', 'bad')
  )
);
CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON daily_notes(date DESC);

-- ── 3. leetcode_problems table ──
CREATE TABLE IF NOT EXISTS leetcode_problems (
  id              BIGSERIAL    PRIMARY KEY,
  date            DATE         NOT NULL,
  problem_number  INTEGER      NOT NULL,
  problem_name    TEXT         NOT NULL,
  difficulty      TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard')),
  CONSTRAINT unique_problem_per_day UNIQUE (date, problem_number)
);
CREATE INDEX IF NOT EXISTS idx_lc_date       ON leetcode_problems(date DESC);
CREATE INDEX IF NOT EXISTS idx_lc_difficulty ON leetcode_problems(difficulty);

-- ── 4. Trigger for daily_notes updated_at ──
CREATE TRIGGER daily_notes_updated_at
  BEFORE UPDATE ON daily_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 5. RLS for new tables ──
ALTER TABLE daily_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leetcode_problems  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_daily_notes"
  ON daily_notes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_leetcode_problems"
  ON leetcode_problems FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── 6. New settings defaults ──
INSERT INTO settings (key, value) VALUES
  ('theme', 'dark'),
  ('notifications_enabled', 'false'),
  ('notification_lead_minutes', '5')
ON CONFLICT (key) DO NOTHING;
```

---

## 8. CLAUDE CODE PROMPT

Use this exact prompt with Claude Code after it has already built the v1 app from SCHEMA.md:

```
Read SCHEMA.md for the full existing application context, then read SCHEMA_UPGRADES.md for all new features to add.

Implement every feature defined in SCHEMA_UPGRADES.md on top of the existing codebase. Work in this order:

1. Run the SQL migration from section 7 (provide the SQL — I will paste it into Supabase myself, do not run it)

2. DATABASE CHANGES — alter habits table, create daily_notes and leetcode_problems tables (already done via SQL above)

3. BACKEND — in this order:
   a. Add is_paused to HabitUpdate model in models/habit.py
   b. Add DailyNoteUpsert and DailyNoteOut to new models/notes.py
   c. Add LeetCodeProblemCreate and LeetCodeProblemOut to models/grind.py
   d. Add models/insights.py with WeeklyReviewOut
   e. Build routers/notes.py with GET /api/notes, POST /api/notes, GET /api/notes/range
   f. Add LeetCode problem routes to routers/grind.py
   g. Update GET /api/habits to support include_paused query param
   h. Add GET /api/insights/weekly-review to routers/insights.py
   i. Register notes router in main.py

4. FRONTEND HOOKS — add useNotes, useLeetCodeProblems, useWeeklyReview, update useHabits with pause/resume mutations, update useSettings with theme support

5. THEME SYSTEM — add light mode CSS variables to index.css, add inline theme script to index.html, update all hardcoded colors to CSS variables

6. NEW COMPONENTS — build in this order:
   a. ThemeToggle (Settings page — first item)
   b. DailyNoteWidget (Home page — between TodayProgress and TaskTimeGroup)
   c. MissedDayRecovery (Home page — top, conditional)
   d. LeetCodeProblemLogger (Grind page — LeetCode tab, below existing number inputs)
   e. JournalTimeline (Insights page — new "Journal" tab)
   f. WeeklyReviewModal (auto-show on Sundays + Settings button)
   g. Habit Pause/Resume (HabitListItem three-dot menu + Paused section on TasksPage)
   h. Drag-and-drop reorder (TasksPage — install @dnd-kit/core @dnd-kit/sortable, add Reorder mode toggle)
   i. PWA notifications (upgrade sw.js, add notification permission flow to Settings)

7. HOME PAGE UPDATES — add MissedDayRecovery banner logic, add DailyNoteWidget, add yesterday-mode switching

8. WEEKLY REVIEW — add auto-show logic to App.tsx on Sundays

Critical requirements — same as v1:
- Mobile-first 390px width
- Framer Motion for all animations
- TanStack Query optimistic updates for all toggles
- TypeScript strict throughout
- No new libraries except @dnd-kit/core and @dnd-kit/sortable
- Do NOT run any git commands
```

---

*End of SCHEMA_UPGRADES.md — GRIND v2 Feature Additions*
*Version 2.0 — Generated for Claude Code implementation*
