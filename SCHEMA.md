# SCHEMA.md — GRIND Daily Habit & Growth Tracker
## Complete Technical Specification for Claude Code

> **Purpose**: This file is the single source of truth for building the entire GRIND application. Every database table, API route, React component, page, and business rule is defined here. Build the full application strictly from this spec. Do not invent features not listed here. Do not omit features that are listed here.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema (Supabase / PostgreSQL)](#5-database-schema)
6. [Backend — Python FastAPI](#6-backend-python-fastapi)
7. [Frontend — React](#7-frontend-react)
8. [Pages & Routes](#8-pages--routes)
9. [Component Specifications](#9-component-specifications)
10. [Business Logic & Rules](#10-business-logic--rules)
11. [Design System](#11-design-system)
12. [Supabase SQL Migration](#12-supabase-sql-migration)
13. [Build & Run Instructions](#13-build--run-instructions)

---

## 1. PROJECT OVERVIEW

**Application name**: GRIND — Daily Habit & Growth Tracker

**What it does**: A personal mobile-first web application for tracking daily habits, gym workouts, LeetCode progress, job applications, and AWS study. Includes deep analytics, streaks, and a futuristic animated UI.

**Single user**: Username `Bhanu`, Password `Bhanu123` — hardcoded, no registration flow.

**Core modules**:
- **Home**: Streak ring, today's tasks sorted by time, quick completions, motivational state
- **Tasks**: Full habit list, add/edit/delete with time picker, category tags
- **Insights**: Deep multi-panel analysis — top/worst 5 habits, heatmap, weekly trends, day-of-week breakdown, LeetCode sub-analysis, gym sub-analysis
- **Grind**: LeetCode daily logger (Easy/Medium/Hard), Job Applications counter, AWS topic checklist, Gym workout checklist
- **Settings**: Streak threshold slider, data export, reset options

**Authentication**:
- Login: username `Bhanu`, password `Bhanu123` — hardcoded, single user
- Session stored in `localStorage` key `grind_session`
- All routes except `/login` are protected — redirect to `/login` if no session

**PWA**:
- Include `public/manifest.json` and `public/sw.js` (basic service worker) so the app can be installed from Chrome/Safari mobile as a PWA ("Add to Home Screen")
- Theme color: `#0a0f1e` (dark navy)
- App name: `GRIND`

---

## 2. TECH STACK

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI framework |
| React Router DOM | 6.x | Client-side routing |
| Vite | 5.x | Build tool and dev server |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Utility-first styling |
| Framer Motion | 11.x | All animations — page transitions, checkbox pulses, number count-ups, glow effects |
| @supabase/supabase-js | 2.x | Database client |
| React Query (TanStack Query) | 5.x | Server state management, optimistic updates |
| Recharts | 2.x | Charts — line, bar, radar, area |
| date-fns | 3.x | Date formatting and manipulation |
| React Hot Toast | 2.x | Toast notifications |
| Lucide React | latest | Icons |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.110+ | Web framework |
| Supabase Python Client | 2.x | Database access |
| Pydantic | 2.x | Request/response validation |
| python-dotenv | 1.x | Environment variable loading |
| uvicorn | 0.29+ | ASGI server |

### Database
| Technology | Purpose |
|-----------|---------|
| Supabase (PostgreSQL 15) | Primary database, Row Level Security |

---

## 3. REPOSITORY STRUCTURE

```
grind/
├── SCHEMA.md                        ← this file
├── README.md
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json            ← PWA manifest
│   │   ├── sw.js                    ← Service worker (basic cache)
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx                 ← React entry, Router setup
│       ├── App.tsx                  ← Route definitions + auth guard
│       ├── index.css                ← Tailwind directives + CSS variables + custom animations
│       ├── lib/
│       │   ├── supabase.ts          ← Supabase client singleton
│       │   ├── api.ts               ← Fetch wrapper for all FastAPI calls
│       │   └── utils.ts             ← formatDate, getTimeCategory, calcStreak, etc.
│       ├── hooks/
│       │   ├── useAuth.ts           ← Login/logout, session check
│       │   ├── useHabits.ts         ← Habit CRUD + completions
│       │   ├── useGrind.ts          ← LeetCode, applications, gym, AWS queries/mutations
│       │   ├── useInsights.ts       ← Analytics aggregations
│       │   └── useSettings.ts       ← Streak threshold + preferences
│       ├── types/
│       │   └── index.ts             ← All TypeScript interfaces
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx          ← Wraps authenticated pages, renders BottomNav
│       │   │   ├── BottomNav.tsx         ← Mobile bottom navigation (4 tabs)
│       │   │   ├── TopBar.tsx            ← Page title + settings gear icon
│       │   │   └── PageWrapper.tsx       ← Consistent scroll container + padding
│       │   ├── ui/
│       │   │   ├── GlassCard.tsx         ← Glassmorphism card container
│       │   │   ├── NeonButton.tsx        ← Glowing neon button
│       │   │   ├── Badge.tsx             ← Category / status badge
│       │   │   ├── ProgressRing.tsx      ← Animated SVG ring (streak / completion %)
│       │   │   ├── AnimatedNumber.tsx    ← Count-up number animation (Framer Motion)
│       │   │   ├── HeatmapCalendar.tsx   ← GitHub-style contribution heatmap
│       │   │   ├── LoadingSpinner.tsx    ← Neon pulse spinner
│       │   │   ├── EmptyState.tsx        ← Empty data placeholder with icon
│       │   │   ├── BottomSheet.tsx       ← Mobile bottom sheet modal (add/edit habit)
│       │   │   └── ConfirmDialog.tsx     ← Delete confirmation dialog
│       │   ├── home/
│       │   │   ├── StreakRing.tsx         ← Large animated streak ring + fire emoji + count
│       │   │   ├── TodayProgress.tsx     ← Horizontal progress bar + % text
│       │   │   ├── TaskTimeGroup.tsx     ← Group of tasks under a time-of-day label
│       │   │   ├── HabitCheckRow.tsx     ← Single habit row with animated checkbox
│       │   │   └── MotivationalBanner.tsx ← Dynamic tagline based on streak length
│       │   ├── tasks/
│       │   │   ├── HabitListItem.tsx     ← Habit row with edit/delete swipe actions
│       │   │   ├── HabitFormSheet.tsx    ← Bottom sheet form: name, time, category
│       │   │   └── FABButton.tsx         ← Floating action button (+) to add habit
│       │   ├── insights/
│       │   │   ├── TopHabitsPanel.tsx    ← Top 5 best habits animated bar chart
│       │   │   ├── WorstHabitsPanel.tsx  ← Bottom 5 worst habits highlighted
│       │   │   ├── WeeklyTrendChart.tsx  ← Line chart: completion % per day for past 4 weeks
│       │   │   ├── DayOfWeekChart.tsx    ← Bar chart: avg completion % by day of week
│       │   │   ├── ConsistencyTable.tsx  ← Per-habit: total days, streak, best streak, % rate
│       │   │   ├── LeetCodeInsights.tsx  ← Easy/Medium/Hard counts over time + cumulative
│       │   │   └── GymInsights.tsx       ← Per-exercise frequency bar chart
│       │   └── grind/
│       │       ├── LeetCodeLogger.tsx    ← Daily Easy/Medium/Hard number inputs + save
│       │       ├── ApplicationsLogger.tsx ← Daily applications count input + save
│       │       ├── AWSChecklist.tsx      ← AWS topics grouped by category, checkboxes
│       │       └── GymChecklist.tsx      ← Gym exercises checklist for today
│       └── pages/
│           ├── LoginPage.tsx            ← Full-screen futuristic login
│           ├── HomePage.tsx             ← Streak + today's tasks
│           ├── TasksPage.tsx            ← All habits management
│           ├── InsightsPage.tsx         ← Analytics tabs
│           ├── GrindPage.tsx            ← LeetCode / Apps / AWS / Gym
│           └── SettingsPage.tsx         ← Streak threshold + preferences
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── main.py                     ← FastAPI app, CORS, router registration
│   ├── config.py                   ← Settings (pydantic-settings)
│   ├── database.py                 ← Supabase client singleton
│   ├── models/
│   │   ├── habit.py                ← Pydantic models for habits + completions
│   │   ├── grind.py                ← Pydantic models for LeetCode, gym, AWS, apps
│   │   └── settings.py             ← Pydantic models for user settings
│   └── routers/
│       ├── auth.py                 ← POST /api/auth/login
│       ├── habits.py               ← /api/habits + /api/habit-completions
│       ├── grind.py                ← /api/grind/leetcode + /api/grind/gym + /api/grind/aws + /api/grind/applications
│       ├── insights.py             ← /api/insights/* aggregation endpoints
│       └── settings.py             ← /api/settings
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 4. ENVIRONMENT VARIABLES

### Frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 5. DATABASE SCHEMA

### 5.1 Table: `habits`

**Purpose**: Master list of all habits defined by the user. Each habit has a name, scheduled time, and category.

```sql
CREATE TABLE habits (
  id            BIGSERIAL    PRIMARY KEY,
  name          TEXT         NOT NULL,
  scheduled_time TIME        NOT NULL,
  category      TEXT         NOT NULL DEFAULT 'general',
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  sort_order    INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_category CHECK (
    category IN ('morning', 'afternoon', 'evening', 'night', 'general')
  )
);

CREATE INDEX idx_habits_is_active    ON habits(is_active);
CREATE INDEX idx_habits_category     ON habits(category);
CREATE INDEX idx_habits_sort_order   ON habits(sort_order);
```

**Column definitions**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `name` | TEXT | NO | — | Display name, e.g. `"Morning care, 11 AM"` |
| `scheduled_time` | TIME | NO | — | Time the habit should be done, e.g. `11:00:00` |
| `category` | TEXT | NO | `'general'` | Time-of-day bucket: `morning`, `afternoon`, `evening`, `night`, `general` |
| `is_active` | BOOLEAN | NO | `true` | Soft-delete flag — false hides it from daily view |
| `sort_order` | INTEGER | NO | `0` | Display order within category |
| `created_at` | TIMESTAMPTZ | NO | now() | When the habit was created |

**Seed data** — insert these rows on first setup (these are the user's current habits from the Excel tracker):

| name | scheduled_time | category |
|------|---------------|----------|
| Wake up by 6 AM | 06:00 | morning |
| Honey Lime/Fennel | 07:00 | morning |
| Aaditya Verma | 08:00 | morning |
| 100 Sides | 09:00 | morning |
| 20 Pushups | 09:00 | morning |
| 5 Min Vocal | 09:00 | morning |
| Morning care | 11:00 | morning |
| D3 | 11:00 | morning |
| Chia Seeds | 11:00 | morning |
| AWS | 14:00 | afternoon |
| Interview Prep | 15:00 | afternoon |
| LeetCode 3-5 | 17:00 | afternoon |
| React | 18:00 | evening |
| Glutathione | 19:00 | evening |
| Gym | 19:00 | evening |
| CV | 23:00 | night |
| 50 Job Applications | 23:00 | night |
| Mg Glycinde | 23:00 | night |
| Night Care | 00:00 | night |

---

### 5.2 Table: `habit_completions`

**Purpose**: Records each day a habit was completed. One row per habit per day.

```sql
CREATE TABLE habit_completions (
  id            BIGSERIAL    PRIMARY KEY,
  habit_id      BIGINT       NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date          DATE         NOT NULL,
  completed_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT unique_habit_per_day UNIQUE (habit_id, date)
);

CREATE INDEX idx_habit_completions_date     ON habit_completions(date);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_habit_date ON habit_completions(habit_id, date);
```

**Column definitions**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `habit_id` | BIGINT | NO | — | FK to `habits.id` |
| `date` | DATE | NO | — | The calendar date of completion |
| `completed_at` | TIMESTAMPTZ | NO | now() | Exact timestamp of the check |

---

### 5.3 Table: `grind_log`

**Purpose**: Daily log for LeetCode problems solved (by difficulty) and job applications submitted.

```sql
CREATE TABLE grind_log (
  id                BIGSERIAL    PRIMARY KEY,
  date              DATE         NOT NULL UNIQUE,
  leetcode_easy     INTEGER      NOT NULL DEFAULT 0,
  leetcode_medium   INTEGER      NOT NULL DEFAULT 0,
  leetcode_hard     INTEGER      NOT NULL DEFAULT 0,
  applications      INTEGER      NOT NULL DEFAULT 0,
  screentime_hours  NUMERIC(4,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_grind_log_date ON grind_log(date DESC);
```

**Column definitions**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `date` | DATE | NO | — | One row per calendar day (UNIQUE) |
| `leetcode_easy` | INTEGER | NO | `0` | Easy problems solved that day |
| `leetcode_medium` | INTEGER | NO | `0` | Medium problems solved that day |
| `leetcode_hard` | INTEGER | NO | `0` | Hard problems solved that day |
| `applications` | INTEGER | NO | `0` | Job applications submitted that day |
| `screentime_hours` | NUMERIC(4,2) | YES | NULL | Optional phone screentime in hours |
| `notes` | TEXT | YES | NULL | Optional free text note for the day |
| `created_at` | TIMESTAMPTZ | NO | now() | Row created at |
| `updated_at` | TIMESTAMPTZ | NO | now() | Last updated (auto-trigger) |

---

### 5.4 Table: `gym_exercises`

**Purpose**: Master list of all gym exercises.

```sql
CREATE TABLE gym_exercises (
  id          BIGSERIAL    PRIMARY KEY,
  name        TEXT         NOT NULL UNIQUE,
  category    TEXT         NOT NULL DEFAULT 'strength',
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  CONSTRAINT valid_gym_category CHECK (
    category IN ('cardio', 'strength', 'core', 'supplement')
  )
);
```

**Seed data**:

| name | category | sort_order |
|------|----------|-----------|
| 20 Min Cardio | cardio | 1 |
| Bench Press | strength | 2 |
| Squats | strength | 3 |
| Shoulders | strength | 4 |
| Sides 1 | strength | 5 |
| Sides 2 | strength | 6 |
| Crunches | core | 7 |
| Pushups | core | 8 |
| Plank | core | 9 |
| Protein Shake | supplement | 10 |
| Creatine | supplement | 11 |

---

### 5.5 Table: `gym_completions`

**Purpose**: Records each gym exercise completed per day.

```sql
CREATE TABLE gym_completions (
  id              BIGSERIAL    PRIMARY KEY,
  exercise_id     BIGINT       NOT NULL REFERENCES gym_exercises(id) ON DELETE CASCADE,
  date            DATE         NOT NULL,
  completed_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT unique_exercise_per_day UNIQUE (exercise_id, date)
);

CREATE INDEX idx_gym_completions_date        ON gym_completions(date);
CREATE INDEX idx_gym_completions_exercise_id ON gym_completions(exercise_id);
```

---

### 5.6 Table: `aws_topics`

**Purpose**: AWS study topic checklist. Each topic can be marked complete (persistent, not daily).

```sql
CREATE TABLE aws_topics (
  id            BIGSERIAL    PRIMARY KEY,
  category      TEXT         NOT NULL,
  name          TEXT         NOT NULL,
  is_completed  BOOLEAN      NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  sort_order    INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_aws_topics_category     ON aws_topics(category);
CREATE INDEX idx_aws_topics_is_completed ON aws_topics(is_completed);
```

**Seed data** (grouped by AWS service category):

| category | name |
|----------|------|
| IAM | Users, Groups, and Policies |
| IAM | Roles and Trust Policies |
| IAM | MFA and Password Policies |
| IAM | Identity Federation (SSO/SAML) |
| S3 | Buckets and Objects |
| S3 | Bucket Policies and ACLs |
| S3 | Versioning and Lifecycle Rules |
| S3 | S3 Storage Classes |
| S3 | Cross-Region Replication |
| S3 | Pre-signed URLs |
| EC2 | Instance Types and Launch |
| EC2 | Security Groups and Key Pairs |
| EC2 | AMIs and Snapshots |
| EC2 | Auto Scaling Groups |
| EC2 | Load Balancers (ALB/NLB) |
| VPC | Subnets (Public/Private) |
| VPC | Internet Gateways and NAT |
| VPC | Route Tables |
| VPC | Security Groups vs NACLs |
| RDS | RDS Instances and Engines |
| RDS | Multi-AZ and Read Replicas |
| RDS | Backups and Snapshots |
| Lambda | Function Creation and Triggers |
| Lambda | IAM Execution Roles |
| Lambda | Environment Variables |
| CloudWatch | Metrics and Alarms |
| CloudWatch | Logs and Log Groups |
| CloudFormation | Stacks and Templates |
| Route53 | Hosted Zones and Record Types |
| Route53 | Routing Policies |

---

### 5.7 Table: `settings`

**Purpose**: Key-value store for user preferences.

```sql
CREATE TABLE settings (
  key         TEXT    PRIMARY KEY,
  value       TEXT    NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Default rows** (insert on migration):

| key | value | description |
|-----|-------|-------------|
| `streak_threshold` | `70` | Minimum daily completion % to count as a streak day (integer 50–90) |
| `theme` | `dark` | Reserved for future theme toggle |
| `notifications_enabled` | `false` | Reserved for future push notifications |

---

## 6. BACKEND — PYTHON FASTAPI

### 6.1 `main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth, habits, grind, insights, settings as settings_router

app = FastAPI(title="GRIND API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",     tags=["auth"])
app.include_router(habits.router,    prefix="/api/habits",   tags=["habits"])
app.include_router(grind.router,     prefix="/api/grind",    tags=["grind"])
app.include_router(insights.router,  prefix="/api/insights", tags=["insights"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])

@app.get("/health")
def health():
    return {"status": "ok"}
```

### 6.2 `config.py`

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"

settings = Settings()
```

### 6.3 `database.py`

```python
from supabase import create_client, Client
from config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
```

---

### 6.4 Router: `routers/auth.py`

**POST `/api/auth/login`**
- Request body: `{ "username": string, "password": string }`
- Logic: Check if username == `"Bhanu"` and password == `"Bhanu123"`. If match, return `{ "success": true, "token": "grind_auth_token" }`. If not, return HTTP 401 `{ "detail": "Invalid credentials" }`.
- No JWT needed. The frontend stores the static token string in `localStorage` key `grind_session` and sends it as `Authorization: Bearer grind_auth_token` on subsequent requests.
- All other routes check for this exact bearer token in a FastAPI dependency `verify_token(request)`. If missing or wrong, return HTTP 401.

**POST `/api/auth/logout`**
- Returns `{ "success": true }`. Frontend clears `localStorage`.

---

### 6.5 Router: `routers/habits.py`

All routes require `verify_token`.

**GET `/api/habits`**
- Returns all habits where `is_active = true`, ordered by `scheduled_time ASC`.
- Response: `List[HabitOut]`

**POST `/api/habits`**
- Creates a new habit.
- Request body: `HabitCreate { name, scheduled_time, category }`
- Auto-assigns `category` based on `scheduled_time` if not provided (see Business Logic 10.2).
- Response: `HabitOut`

**PUT `/api/habits/{habit_id}`**
- Updates name, scheduled_time, or category.
- Request body: `HabitUpdate { name?, scheduled_time?, category? }`
- Response: `HabitOut`

**DELETE `/api/habits/{habit_id}`**
- Soft-delete: sets `is_active = false`.
- Response: `{ "success": true }`

**GET `/api/habits/completions`**
- Query params: `date: string (YYYY-MM-DD)` — defaults to today
- Returns all `habit_completions` rows for that date joined with habit name.
- Response: `List[CompletionOut]`

**POST `/api/habits/completions`**
- Toggles a habit completion for today.
- Request body: `{ "habit_id": int, "date": string, "completed": bool }`
- If `completed = true`: upsert a row into `habit_completions`.
- If `completed = false`: delete the row for `(habit_id, date)`.
- Response: `{ "success": true, "completed": bool }`

**GET `/api/habits/completions/range`**
- Query params: `start_date`, `end_date`
- Returns all completions in the range, grouped by date.
- Used by heatmap and trend charts.
- Response: `List[DailyCompletionSummary { date, total_completed, total_habits, pct }]`

---

### 6.6 Router: `routers/grind.py`

All routes require `verify_token`.

**GET `/api/grind/log`**
- Query param: `date` (defaults to today)
- Returns the `grind_log` row for that date, or `null` if none.
- Response: `GrindLogOut | null`

**POST `/api/grind/log`**
- Upsert a `grind_log` row for the given date.
- Request body: `GrindLogUpsert { date, leetcode_easy?, leetcode_medium?, leetcode_hard?, applications?, screentime_hours?, notes? }`
- Response: `GrindLogOut`

**GET `/api/grind/log/range`**
- Query params: `start_date`, `end_date`
- Returns all `grind_log` rows in range, ordered by date ASC.
- Response: `List[GrindLogOut]`

**GET `/api/grind/gym`**
- Returns all `gym_exercises` where `is_active = true`, with completion status for today.
- Response: `List[GymExerciseWithStatus { id, name, category, sort_order, completed_today: bool }]`

**POST `/api/grind/gym/toggle`**
- Toggles a gym exercise completion for today (same upsert/delete pattern as habits).
- Request body: `{ "exercise_id": int, "date": string, "completed": bool }`
- Response: `{ "success": true, "completed": bool }`

**GET `/api/grind/gym/history`**
- Query params: `start_date`, `end_date`
- Returns gym completions grouped by date and exercise.
- Response: `List[GymDaySummary { date, completions: List[{ exercise_id, exercise_name }] }]`

**GET `/api/grind/aws`**
- Returns all `aws_topics`, grouped by category, ordered by `sort_order`.
- Response: `List[AwsTopic]`

**PUT `/api/grind/aws/{topic_id}`**
- Toggles `is_completed` for an AWS topic.
- Request body: `{ "is_completed": bool }`
- Sets `completed_at` to `now()` if completing, or `null` if un-completing.
- Response: `AwsTopic`

---

### 6.7 Router: `routers/insights.py`

All routes require `verify_token`.

**GET `/api/insights/streak`**
- Calculates current streak from today backwards.
- Uses `streak_threshold` from settings table.
- A day counts toward streak if `(completed_habits / total_active_habits) * 100 >= streak_threshold`.
- Response: `{ "current_streak": int, "longest_streak": int, "streak_threshold": int, "today_pct": float }`

**GET `/api/insights/top-habits`**
- Looks at last 30 days. Calculates completion rate per habit (days completed / days active).
- Response: `{ "top5": List[HabitRank], "bottom5": List[HabitRank] }` where `HabitRank = { habit_id, name, completion_rate, total_days, completed_days }`

**GET `/api/insights/weekly-trend`**
- Returns past 28 days of daily completion percentages.
- Response: `List[{ date, pct, completed, total }]`

**GET `/api/insights/day-of-week`**
- Groups last 90 days by day of week (Mon–Sun).
- Calculates average completion % per day of week.
- Response: `List[{ day_name, avg_pct }]`

**GET `/api/insights/consistency`**
- Per habit: total completed days, current streak, best streak, completion rate %.
- Response: `List[HabitConsistency { habit_id, name, total_completed, completion_rate, current_streak, best_streak }]`

**GET `/api/insights/leetcode`**
- Returns cumulative LeetCode totals + last 30 days of daily breakdown.
- Response: `{ total_easy, total_medium, total_hard, total_all, daily: List[{ date, easy, medium, hard }] }`

**GET `/api/insights/gym`**
- Returns per-exercise completion count for last 30 days.
- Response: `List[{ exercise_name, category, count }]`

---

### 6.8 Router: `routers/settings.py`

All routes require `verify_token`.

**GET `/api/settings`**
- Returns all key-value rows from `settings` table as a flat object.
- Response: `{ "streak_threshold": "70", "theme": "dark", ... }`

**PUT `/api/settings/{key}`**
- Updates a single setting value.
- Request body: `{ "value": string }`
- Response: `{ "key": string, "value": string }`

---

### 6.9 Pydantic Models

#### `models/habit.py`
```python
from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime

class HabitCreate(BaseModel):
    name: str
    scheduled_time: str  # "HH:MM" format
    category: Optional[str] = None

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    scheduled_time: Optional[str] = None
    category: Optional[str] = None

class HabitOut(BaseModel):
    id: int
    name: str
    scheduled_time: str
    category: str
    is_active: bool
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
```

#### `models/grind.py`
```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

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
    screentime_hours: Optional[float]
    notes: Optional[str]

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

class AwsTopic(BaseModel):
    id: int
    category: str
    name: str
    is_completed: bool
    completed_at: Optional[datetime]
    sort_order: int

class AwsTopicUpdate(BaseModel):
    is_completed: bool
```

#### `models/settings.py`
```python
from pydantic import BaseModel

class SettingUpdate(BaseModel):
    value: str
```

---

## 7. FRONTEND — REACT

### 7.1 `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 7.2 `src/lib/api.ts`
```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('grind_session');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
```

### 7.3 `src/lib/utils.ts`
```typescript
import { format, isToday, differenceInCalendarDays, parseISO } from 'date-fns';

export const formatDate = (d: Date | string) => format(new Date(d as string), 'yyyy-MM-dd');
export const formatDisplay = (d: Date | string) => format(new Date(d as string), 'MMM d, yyyy');
export const formatTime = (t: string) => {
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
};

export const getTimeCategory = (time: string): string => {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const getMotivationalTagline = (streak: number): string => {
  if (streak === 0) return "Every legend starts somewhere. Start today.";
  if (streak < 3) return "The fire is lit. Don't let it die.";
  if (streak < 7) return "Momentum is building. Keep grinding.";
  if (streak < 14) return "One week in. You're becoming consistent.";
  if (streak < 30) return "Two weeks strong. Habits are forming.";
  if (streak < 60) return "A month of discipline. You're different now.";
  return "You're built different. Keep going.";
};

export const today = () => formatDate(new Date());
```

### 7.4 `src/types/index.ts`
```typescript
export interface Habit {
  id: number;
  name: string;
  scheduled_time: string;
  category: 'morning' | 'afternoon' | 'evening' | 'night' | 'general';
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  habit_name: string;
  date: string;
  completed_at: string;
}

export interface DailyCompletionSummary {
  date: string;
  total_completed: number;
  total_habits: number;
  pct: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  streak_threshold: number;
  today_pct: number;
}

export interface HabitRank {
  habit_id: number;
  name: string;
  completion_rate: number;
  total_days: number;
  completed_days: number;
}

export interface HabitConsistency {
  habit_id: number;
  name: string;
  total_completed: number;
  completion_rate: number;
  current_streak: number;
  best_streak: number;
}

export interface GrindLog {
  id: number;
  date: string;
  leetcode_easy: number;
  leetcode_medium: number;
  leetcode_hard: number;
  applications: number;
  screentime_hours: number | null;
  notes: string | null;
}

export interface GymExercise {
  id: number;
  name: string;
  category: 'cardio' | 'strength' | 'core' | 'supplement';
  sort_order: number;
  completed_today: boolean;
}

export interface AwsTopic {
  id: number;
  category: string;
  name: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface AppSettings {
  streak_threshold: string;
  theme: string;
  notifications_enabled: string;
}
```

---

## 8. PAGES & ROUTES

### Route map

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/login` | `LoginPage` | No | Fullscreen login |
| `/` | `HomePage` | Yes | Streak + today's tasks |
| `/tasks` | `TasksPage` | Yes | Habit management |
| `/insights` | `InsightsPage` | Yes | Analytics |
| `/grind` | `GrindPage` | Yes | LeetCode / Gym / AWS |
| `/settings` | `SettingsPage` | Yes | Preferences |

`App.tsx` wraps `/`, `/tasks`, `/insights`, `/grind`, `/settings` in `<AppShell>` which renders `<BottomNav>`. If no `grind_session` in localStorage, redirect to `/login`.

---

### 8.1 `LoginPage.tsx`

**Layout**: Full screen, dark navy background. Centered card with glassmorphism effect.

**Elements**:
- App logo/wordmark: `GRIND` in large bold font with neon cyan glow text shadow
- Subtitle: `"Your daily discipline engine"`
- Input: Username (placeholder: `"Username"`)
- Input: Password (placeholder: `"Password"`, type password)
- Submit button: `"Enter the Grind"` — full width, neon cyan gradient, pulsing glow animation on hover
- Error message: shown below button in red if credentials wrong

**Animation**:
- Card fades in from below on mount (Framer Motion `initial={{ opacity: 0, y: 40 }}`, `animate={{ opacity: 1, y: 0 }}`)
- Background: subtle animated gradient mesh or particle dots using CSS animation

**Logic**:
- On submit: POST `/api/auth/login` with `{ username, password }`
- If success: store `"grind_auth_token"` in `localStorage.setItem('grind_session', token)`, redirect to `/`
- If error: show `"Invalid credentials"` message

---

### 8.2 `HomePage.tsx`

**Layout**: Scrollable single-column page inside `AppShell`.

**Sections (top to bottom)**:

1. **Top bar**: `"Good morning, Bhanu 👋"` (greeting changes by time of day), and today's date
2. **Streak section** (60% of visible viewport height): `<StreakRing>` component — large animated ring with streak count in center and fire emoji
3. **Today's Progress**: `<TodayProgress>` — animated horizontal progress bar with `"X / Y habits done"` label
4. **Motivational banner**: `<MotivationalBanner>` — tagline based on streak
5. **Today's Tasks**: `<TaskTimeGroup>` components — tasks grouped by time category (Morning / Afternoon / Evening / Night), sorted by `scheduled_time`. Each group header shows the time label. Each task shows `<HabitCheckRow>` with animated checkbox.

**Behavior**:
- On page load: fetch `/api/habits`, `/api/habits/completions?date=today`, `/api/insights/streak`
- Checking a habit calls POST `/api/habits/completions` with optimistic update (TanStack Query `useMutation` with `onMutate`)
- Streak ring uses data from `/api/insights/streak`

---

### 8.3 `TasksPage.tsx`

**Layout**: Scrollable list with FAB button fixed at bottom-right.

**Sections**:
1. **Tab bar**: Tabs for `All`, `Morning`, `Afternoon`, `Evening`, `Night` — filters the list
2. **Habit list**: Each item is `<HabitListItem>` showing name, time badge, category badge
3. **FAB**: `<FABButton>` — `+` button, fixed bottom-right, opens `<HabitFormSheet>`

**HabitListItem behavior**:
- Shows three-dot menu (or swipe actions on mobile) with "Edit" and "Delete" options
- Edit opens `<HabitFormSheet>` pre-filled
- Delete opens `<ConfirmDialog>` before calling DELETE endpoint

**HabitFormSheet** (bottom sheet modal):
- Fields: `Name` (text input), `Time` (time picker input, type="time"), `Category` (select: Morning / Afternoon / Evening / Night / General — or auto-set from time)
- Submit button: "Save Habit"
- On save: POST or PUT to `/api/habits`, then invalidate `habits` query

---

### 8.4 `InsightsPage.tsx`

**Layout**: Horizontal scroll tab bar at top, content below.

**Tabs**:

| Tab | Component | Description |
|-----|-----------|-------------|
| Overview | `<TopHabitsPanel>` + `<WorstHabitsPanel>` | Top 5 + Bottom 5 habit bars |
| Trends | `<WeeklyTrendChart>` + `<DayOfWeekChart>` | Line chart + day-of-week bar |
| Consistency | `<ConsistencyTable>` | Per-habit stats table |
| Heatmap | `<HeatmapCalendar>` | GitHub-style 90-day heatmap |
| LeetCode | `<LeetCodeInsights>` | LeetCode cumulative + daily breakdown |
| Gym | `<GymInsights>` | Per-exercise frequency |

**Data loading**: Each tab lazily fetches its data when first activated (not all at once).

---

### 8.5 `GrindPage.tsx`

**Layout**: Horizontal scroll tab bar at top, content below.

**Tabs**:

| Tab | Component | Description |
|-----|-----------|-------------|
| LeetCode | `<LeetCodeLogger>` | Input today's Easy/Medium/Hard count + running totals |
| Applications | `<ApplicationsLogger>` | Input today's application count + running total |
| AWS | `<AWSChecklist>` | AWS topics grouped by service, checkboxes |
| Gym | `<GymChecklist>` | Today's gym exercises checklist |

---

### 8.6 `SettingsPage.tsx`

**Layout**: Single column list of settings groups.

**Settings groups**:

1. **Streak**:
   - "Streak Threshold" — label showing current value (e.g. `70%`)
   - Slider: min 50, max 90, step 5. Saves to `/api/settings/streak_threshold` on change.
   - Description: `"A day counts toward your streak if you complete at least X% of your habits"`

2. **Data**:
   - "Export Data" button — calls a download endpoint or generates JSON export of all completions
   - "Reset Today's Progress" button — opens confirm dialog, deletes today's habit_completions

3. **Account**:
   - "Sign Out" button — clears `grind_session` from localStorage, redirects to `/login`

4. **About**:
   - App version: `1.0.0`
   - Tagline: `"Built for Bhanu. Powered by discipline."`

---

## 9. COMPONENT SPECIFICATIONS

### 9.1 `BottomNav.tsx`

**Layout**: Fixed at bottom of viewport, full width, `z-index: 50`. Height: 64px. Background: `rgba(10, 15, 30, 0.95)` with backdrop blur. Top border: 1px solid `rgba(0, 255, 255, 0.1)`.

**Tabs**:
| Label | Icon (Lucide) | Route |
|-------|---------------|-------|
| Home | `Home` | `/` |
| Tasks | `CheckSquare` | `/tasks` |
| Insights | `BarChart2` | `/insights` |
| Grind | `Zap` | `/grind` |

**Active tab**: Icon and label glow neon cyan (`#00ffff`). Inactive: muted gray. Animate active indicator: small neon dot above icon using Framer Motion `layoutId` for smooth sliding transition between tabs.

---

### 9.2 `StreakRing.tsx`

**Visual**: Large SVG circle (280px diameter on mobile). Two strokes: background ring (dark gray) and foreground ring (neon cyan/teal gradient) that animates from 0 to `(today_pct / 100) * circumference` on mount.

**Center content**:
- 🔥 emoji (32px)
- Streak number: large bold count-up animation using `<AnimatedNumber>` (Framer Motion)
- Label: `"day streak"`

**Color**: Green when streak > 0, yellow if today not yet at threshold, gray if streak is 0.

**Glow**: CSS `filter: drop-shadow(0 0 12px #00ffff)` on the SVG path.

---

### 9.3 `HabitCheckRow.tsx`

**Layout**: Full-width row with checkbox on left, habit name + time badge on right.

**Checkbox**: Custom animated checkbox — when checked:
1. Scale down slightly (Framer Motion spring)
2. Fill neon cyan
3. Checkmark draws in with SVG path animation
4. Row background flashes subtle cyan glow for 300ms

**Time badge**: Small pill showing formatted time (e.g. `"11 AM"`). Color depends on whether time has passed: past = muted gray, upcoming = cyan, overdue unchecked = amber/orange.

---

### 9.4 `HeatmapCalendar.tsx`

**Visual**: Grid of small squares (10px each, 2px gap) arranged in a GitHub-style calendar. Shows last 90 days. Columns = weeks (Mon–Sun), rows = days of week.

**Colors** (based on completion %):
- `0%` = `#1a1f2e` (near-black)
- `1–30%` = `#0d4f4f`
- `31–60%` = `#0a9e9e`
- `61–89%` = `#00d4d4`
- `90–100%` = `#00ffff` (full neon)

**Tooltip**: On hover/tap, show date and completion % in a small tooltip.

---

### 9.5 `AnimatedNumber.tsx`

Uses Framer Motion `useMotionValue` + `useTransform` to count up from 0 to the target number on mount, over 800ms with ease-out. Used for streak count, LeetCode totals, and any stat card numbers.

---

### 9.6 `GlassCard.tsx`

**Styles**:
```
background: rgba(255, 255, 255, 0.03)
border: 1px solid rgba(0, 255, 255, 0.1)
border-radius: 16px
backdrop-filter: blur(12px)
padding: 16px
```

Used as the standard container for all sections on every page.

---

### 9.7 `LeetCodeLogger.tsx`

**Layout**: Three number input rows (Easy / Medium / Hard) styled with color coding:
- Easy: green (`#22c55e`)
- Medium: amber (`#f59e0b`)
- Hard: red (`#ef4444`)

Each row: label + color dot + number input (large, centered, tap-friendly) + increment/decrement buttons (large touch targets, 44px min).

Below inputs: `"Save Today's Progress"` button.

Above inputs: running totals card showing cumulative Easy / Medium / Hard / Total with `<AnimatedNumber>`.

---

### 9.8 `AWSChecklist.tsx`

**Layout**: Grouped by AWS service category (IAM, S3, EC2, etc.). Each group has a header with the service name and a progress count (e.g. `"IAM — 3/4"`). Each topic is a checkbox row.

**Completed topics**: Strikethrough text, muted color, green check icon.

**Progress bar per category**: Small horizontal bar below category header showing completion %.

---

### 9.9 `BottomSheet.tsx`

A generic mobile bottom sheet. Slides up from bottom on open (Framer Motion `y: "100%" → y: 0`). Backdrop darkens behind it. Drag-down gesture to close. Used for `HabitFormSheet` and `ConfirmDialog`.

---

## 10. BUSINESS LOGIC & RULES

### 10.1 Streak Calculation

A "streak day" is any day where:
```
(total habits completed that day / total active habits) * 100 >= streak_threshold
```

- `streak_threshold` is read from `settings` table, key `streak_threshold` (default `70`)
- Calculate current streak: starting from today, go backwards day by day until a day does not meet threshold
- Today counts in the streak only if today's completion % >= threshold
- A day with no data at all (no rows) counts as 0% completion (breaks streak)

### 10.2 Auto Category from Time

If category is not explicitly set when creating a habit, derive it from `scheduled_time`:
- `05:00–11:59` → `morning`
- `12:00–16:59` → `afternoon`
- `17:00–20:59` → `evening`
- `21:00–04:59` → `night`

### 10.3 Task Time Ordering on Home Page

Tasks are always displayed sorted by `scheduled_time` ASC within each time-of-day group. Groups themselves appear in order: Morning → Afternoon → Evening → Night.

Tasks where the scheduled time has already passed today and the habit is NOT completed are highlighted with an amber/orange overdue color.

### 10.4 Optimistic Updates

All checkbox toggles (habit completions, gym completions) use TanStack Query `useMutation` with `onMutate` optimistic updates so the UI responds instantly without waiting for the server.

### 10.5 LeetCode Log Behavior

The `grind_log` table has one row per day (UNIQUE on date). When saving, the backend does an upsert (`INSERT ... ON CONFLICT (date) DO UPDATE`). The frontend always loads today's existing values first (GET `/api/grind/log?date=today`) and pre-fills the inputs.

### 10.6 AWS Topics are Persistent (Not Daily)

Unlike habits and gym exercises, AWS topic completions are stored directly on the `aws_topics` table (`is_completed` boolean) rather than in a separate daily completions table. Marking an AWS topic complete is permanent (until manually unmarked). This reflects that studying a topic is a one-time milestone.

### 10.7 Grind Tab — Applications Logger

Same upsert behavior as LeetCode — uses the `applications` column of `grind_log`. Loads today's existing count on mount and allows editing the number up/down.

---

## 11. DESIGN SYSTEM

### 11.1 Color Palette

```css
:root {
  /* Backgrounds */
  --color-bg-base:       #0a0f1e;   /* Page background — deep navy */
  --color-bg-elevated:   #111827;   /* Card background */
  --color-bg-glass:      rgba(255, 255, 255, 0.03); /* Glassmorphism surface */

  /* Neon Accents */
  --color-neon-cyan:     #00ffff;
  --color-neon-purple:   #a855f7;
  --color-neon-green:    #22c55e;
  --color-neon-amber:    #f59e0b;
  --color-neon-red:      #ef4444;

  /* Text */
  --color-text-primary:  #f0f4ff;
  --color-text-secondary: #6b7a99;
  --color-text-muted:    #374151;

  /* Borders */
  --color-border:        rgba(0, 255, 255, 0.1);
  --color-border-hover:  rgba(0, 255, 255, 0.3);

  /* Difficulty colors (LeetCode) */
  --color-easy:          #22c55e;
  --color-medium:        #f59e0b;
  --color-hard:          #ef4444;
}
```

### 11.2 Typography

```css
/* Use system font stack for fast load on mobile */
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Scale */
--text-xs:   0.75rem;
--text-sm:   0.875rem;
--text-base: 1rem;
--text-lg:   1.125rem;
--text-xl:   1.25rem;
--text-2xl:  1.5rem;
--text-4xl:  2.25rem;
```

### 11.3 Spacing & Radius

```css
--radius-sm:   8px;
--radius-md:   12px;
--radius-lg:   16px;
--radius-full: 9999px;

/* Bottom safe area for iPhone notch */
--safe-bottom: env(safe-area-inset-bottom, 0px);
```

### 11.4 Animations (Framer Motion defaults)

```typescript
// Page transition — used in all page-level components
export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: 'easeOut' }
};

// Card pop-in
export const cardEntrance = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
};

// Stagger children (for list items)
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } }
};

export const staggerItem = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 }
};
```

### 11.5 Tailwind Config Additions (`tailwind.config.ts`)

```typescript
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-cyan':   '#00ffff',
        'neon-purple': '#a855f7',
        'bg-base':     '#0a0f1e',
        'bg-elevated': '#111827',
      },
      boxShadow: {
        'neon':     '0 0 12px rgba(0, 255, 255, 0.4)',
        'neon-lg':  '0 0 24px rgba(0, 255, 255, 0.3)',
        'neon-sm':  '0 0 6px rgba(0, 255, 255, 0.3)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
    }
  }
}
```

### 11.6 Global CSS (`index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  background-color: #0a0f1e;
  color: #f0f4ff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overscroll-behavior: none;
}

/* Hide scrollbar but keep scroll */
::-webkit-scrollbar { display: none; }
* { -ms-overflow-style: none; scrollbar-width: none; }

/* Neon text glow utility */
.neon-text {
  text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff40;
}

/* Glow pulse animation for login button */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px #00ffff40; }
  50%       { box-shadow: 0 0 20px #00ffff80; }
}
.glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }

/* Animated background gradient for login */
@keyframes gradient-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animated-gradient {
  background: linear-gradient(135deg, #0a0f1e, #0d2137, #0a1628, #070d1a);
  background-size: 400% 400%;
  animation: gradient-shift 8s ease infinite;
}

/* Safe area padding for bottom nav on iPhone */
.pb-safe { padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px)); }
```

### 11.7 Component Patterns (Tailwind)

```
GlassCard:         bg-white/[0.03] border border-neon-cyan/10 rounded-card backdrop-blur-md p-4
NeonButton:        bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon rounded-full px-6 py-3 font-semibold transition-all
NeonButtonSolid:   bg-gradient-to-r from-cyan-500 to-teal-400 text-black font-bold rounded-full px-6 py-3 shadow-neon glow-pulse
Input:             bg-white/5 border border-white/10 focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 rounded-lg px-4 py-3 text-white outline-none w-full
Badge morning:     bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full
Badge afternoon:   bg-cyan-500/20 text-cyan-300 text-xs px-2 py-0.5 rounded-full
Badge evening:     bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full
Badge night:       bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full
BottomNav:         fixed bottom-0 left-0 right-0 h-16 bg-bg-base/95 backdrop-blur border-t border-neon-cyan/10 flex items-center justify-around z-50
```

---

## 12. SUPABASE SQL MIGRATION

Save as `supabase/migrations/001_initial_schema.sql`. Run in Supabase SQL Editor.

```sql
-- ══════════════════════════════════════════════════════════════════
-- GRIND — Habit & Growth Tracker — Initial Database Schema
-- ══════════════════════════════════════════════════════════════════

-- ── TABLE 1: habits ──
CREATE TABLE IF NOT EXISTS habits (
  id             BIGSERIAL    PRIMARY KEY,
  name           TEXT         NOT NULL,
  scheduled_time TIME         NOT NULL,
  category       TEXT         NOT NULL DEFAULT 'general',
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  sort_order     INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_category CHECK (
    category IN ('morning', 'afternoon', 'evening', 'night', 'general')
  )
);
CREATE INDEX IF NOT EXISTS idx_habits_is_active  ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habits_category   ON habits(category);

-- ── TABLE 2: habit_completions ──
CREATE TABLE IF NOT EXISTS habit_completions (
  id            BIGSERIAL    PRIMARY KEY,
  habit_id      BIGINT       NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date          DATE         NOT NULL,
  completed_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT unique_habit_per_day UNIQUE (habit_id, date)
);
CREATE INDEX IF NOT EXISTS idx_hc_date     ON habit_completions(date);
CREATE INDEX IF NOT EXISTS idx_hc_habit    ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_hc_hd       ON habit_completions(habit_id, date);

-- ── TABLE 3: grind_log ──
CREATE TABLE IF NOT EXISTS grind_log (
  id                BIGSERIAL    PRIMARY KEY,
  date              DATE         NOT NULL UNIQUE,
  leetcode_easy     INTEGER      NOT NULL DEFAULT 0,
  leetcode_medium   INTEGER      NOT NULL DEFAULT 0,
  leetcode_hard     INTEGER      NOT NULL DEFAULT 0,
  applications      INTEGER      NOT NULL DEFAULT 0,
  screentime_hours  NUMERIC(4,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grind_date ON grind_log(date DESC);

-- ── TABLE 4: gym_exercises ──
CREATE TABLE IF NOT EXISTS gym_exercises (
  id          BIGSERIAL    PRIMARY KEY,
  name        TEXT         NOT NULL UNIQUE,
  category    TEXT         NOT NULL DEFAULT 'strength',
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  CONSTRAINT valid_gym_category CHECK (
    category IN ('cardio', 'strength', 'core', 'supplement')
  )
);

-- ── TABLE 5: gym_completions ──
CREATE TABLE IF NOT EXISTS gym_completions (
  id             BIGSERIAL    PRIMARY KEY,
  exercise_id    BIGINT       NOT NULL REFERENCES gym_exercises(id) ON DELETE CASCADE,
  date           DATE         NOT NULL,
  completed_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT unique_exercise_per_day UNIQUE (exercise_id, date)
);
CREATE INDEX IF NOT EXISTS idx_gc_date     ON gym_completions(date);
CREATE INDEX IF NOT EXISTS idx_gc_exercise ON gym_completions(exercise_id);

-- ── TABLE 6: aws_topics ──
CREATE TABLE IF NOT EXISTS aws_topics (
  id            BIGSERIAL    PRIMARY KEY,
  category      TEXT         NOT NULL,
  name          TEXT         NOT NULL,
  is_completed  BOOLEAN      NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  sort_order    INTEGER      NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_aws_category     ON aws_topics(category);
CREATE INDEX IF NOT EXISTS idx_aws_is_completed ON aws_topics(is_completed);

-- ── TABLE 7: settings ──
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT    PRIMARY KEY,
  value      TEXT    NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER grind_log_updated_at
  BEFORE UPDATE ON grind_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE habits              ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE grind_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_exercises       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_completions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE aws_topics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings            ENABLE ROW LEVEL SECURITY;

-- Allow anon full access (backend uses service role key which bypasses RLS)
-- These policies are for frontend direct reads
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['habits','habit_completions','grind_log','gym_exercises','gym_completions','aws_topics','settings']
  LOOP
    EXECUTE format('CREATE POLICY "anon_all_%s" ON %s FOR ALL TO anon USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- SEED DATA
-- ══════════════════════════════════════════════════════════════════

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('streak_threshold', '70'),
  ('theme', 'dark'),
  ('notifications_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

-- Habits seed
INSERT INTO habits (name, scheduled_time, category, sort_order) VALUES
  ('Wake up by 6 AM',      '06:00', 'morning',   1),
  ('Honey Lime/Fennel',    '07:00', 'morning',   2),
  ('Aaditya Verma',        '08:00', 'morning',   3),
  ('100 Sides',            '09:00', 'morning',   4),
  ('20 Pushups',           '09:00', 'morning',   5),
  ('5 Min Vocal',          '09:00', 'morning',   6),
  ('Morning care',         '11:00', 'morning',   7),
  ('D3',                   '11:00', 'morning',   8),
  ('Chia Seeds',           '11:00', 'morning',   9),
  ('AWS',                  '14:00', 'afternoon', 10),
  ('Interview Prep',       '15:00', 'afternoon', 11),
  ('LeetCode 3-5',         '17:00', 'afternoon', 12),
  ('React',                '18:00', 'evening',   13),
  ('Glutathione',          '19:00', 'evening',   14),
  ('Gym',                  '19:00', 'evening',   15),
  ('CV',                   '23:00', 'night',     16),
  ('50 Job Applications',  '23:00', 'night',     17),
  ('Mg Glycinde',          '23:00', 'night',     18),
  ('Night Care',           '00:00', 'night',     19)
ON CONFLICT DO NOTHING;

-- Gym exercises seed
INSERT INTO gym_exercises (name, category, sort_order) VALUES
  ('20 Min Cardio',  'cardio',     1),
  ('Bench Press',    'strength',   2),
  ('Squats',         'strength',   3),
  ('Shoulders',      'strength',   4),
  ('Sides 1',        'strength',   5),
  ('Sides 2',        'strength',   6),
  ('Crunches',       'core',       7),
  ('Pushups',        'core',       8),
  ('Plank',          'core',       9),
  ('Protein Shake',  'supplement', 10),
  ('Creatine',       'supplement', 11)
ON CONFLICT (name) DO NOTHING;

-- AWS topics seed
INSERT INTO aws_topics (category, name, sort_order) VALUES
  ('IAM', 'Users, Groups, and Policies',    1),
  ('IAM', 'Roles and Trust Policies',       2),
  ('IAM', 'MFA and Password Policies',      3),
  ('IAM', 'Identity Federation (SSO/SAML)', 4),
  ('S3',  'Buckets and Objects',            5),
  ('S3',  'Bucket Policies and ACLs',       6),
  ('S3',  'Versioning and Lifecycle Rules', 7),
  ('S3',  'S3 Storage Classes',             8),
  ('S3',  'Cross-Region Replication',       9),
  ('S3',  'Pre-signed URLs',               10),
  ('EC2', 'Instance Types and Launch',     11),
  ('EC2', 'Security Groups and Key Pairs', 12),
  ('EC2', 'AMIs and Snapshots',            13),
  ('EC2', 'Auto Scaling Groups',           14),
  ('EC2', 'Load Balancers (ALB/NLB)',      15),
  ('VPC', 'Subnets (Public/Private)',      16),
  ('VPC', 'Internet Gateways and NAT',     17),
  ('VPC', 'Route Tables',                  18),
  ('VPC', 'Security Groups vs NACLs',      19),
  ('RDS', 'RDS Instances and Engines',     20),
  ('RDS', 'Multi-AZ and Read Replicas',    21),
  ('RDS', 'Backups and Snapshots',         22),
  ('Lambda', 'Function Creation and Triggers', 23),
  ('Lambda', 'IAM Execution Roles',        24),
  ('Lambda', 'Environment Variables',      25),
  ('CloudWatch', 'Metrics and Alarms',     26),
  ('CloudWatch', 'Logs and Log Groups',    27),
  ('CloudFormation', 'Stacks and Templates', 28),
  ('Route53', 'Hosted Zones and Record Types', 29),
  ('Route53', 'Routing Policies',          30)
ON CONFLICT DO NOTHING;
```

---

## 13. BUILD & RUN INSTRUCTIONS

### 13.1 `requirements.txt` (backend)
```
fastapi==0.110.0
uvicorn[standard]==0.29.0
supabase==2.4.0
pydantic==2.6.0
pydantic-settings==2.2.0
python-dotenv==1.0.1
httpx==0.27.0
```

### 13.2 `package.json` (frontend)
```json
{
  "name": "grind-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "@supabase/supabase-js": "^2.43.0",
    "@tanstack/react-query": "^5.32.0",
    "framer-motion": "^11.0.0",
    "recharts": "^2.12.0",
    "date-fns": "^3.6.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.378.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

### 13.3 `public/manifest.json` (PWA)
```json
{
  "name": "GRIND",
  "short_name": "GRIND",
  "description": "Your daily discipline engine",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0f1e",
  "theme_color": "#0a0f1e",
  "orientation": "portrait",
  "icons": [
    { "src": "/favicon.ico", "sizes": "64x64", "type": "image/x-icon" }
  ]
}
```

### 13.4 `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
});
```

### 13.5 How to run locally

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in Supabase URL + service role key
uvicorn main:app --reload --port 8000
```

**Frontend**:
```bash
cd frontend
npm install
cp .env.example .env       # fill in Supabase URL + anon key + API URL
npm run dev                # http://localhost:5173
```

**Supabase**:
1. Create a new Supabase project
2. Go to SQL Editor → paste the full migration SQL from section 12 → Run
3. Copy Project URL and anon key → paste into `frontend/.env`
4. Copy Service Role key → paste into `backend/.env`

**Access**:
- App: `http://localhost:5173` → Login with `Bhanu` / `Bhanu123`
- API docs: `http://localhost:8000/docs`

### 13.6 First message to Claude Code

After creating the repo and adding this SCHEMA.md, use this prompt:

```
Please read SCHEMA.md completely and carefully before writing any code.

Build the full GRIND Daily Habit & Growth Tracker as described. Work in this order:

1. Set up the repository structure exactly as defined in section 3
2. Run the Supabase SQL migration from section 12 (provide the SQL, do not run it — I will paste it myself)
3. Build the backend (FastAPI) with all files in section 6 — auth, habits, grind, insights, settings routers
4. Build the frontend (React + Vite + Tailwind + Framer Motion) with all files in section 7
5. Implement all pages as defined in section 8
6. Implement all components as defined in section 9
7. Apply the full design system from section 11 — dark futuristic theme, neon cyan accents, glassmorphism cards, Framer Motion animations

Critical requirements:
- Mobile-first: every page must work perfectly at 390px width (iPhone)
- Bottom navigation bar (not sidebar) for all authenticated pages
- Use Framer Motion for ALL animations — page transitions, checkbox pulses, streak ring draw, number count-ups, bottom sheet slides
- Use TanStack Query with optimistic updates for all checkbox toggles
- Use TypeScript strictly throughout
- Use Tailwind utility classes only — no inline styles except for dynamic values
- Every API call from frontend goes through src/lib/api.ts
- Do not use any libraries not listed in section 2
- Include PWA manifest.json as defined in section 13.3
```

---

*End of SCHEMA.md — GRIND Daily Habit & Growth Tracker*
*Version 1.0 — Generated for Claude Code implementation*
