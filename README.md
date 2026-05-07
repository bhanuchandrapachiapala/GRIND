# GRIND — Daily Habit & Growth Tracker

A personal mobile-first PWA for tracking daily habits, gym workouts, LeetCode progress, job applications, and AWS study. Dark, futuristic, neon-cyan UI — built strictly to the spec in [SCHEMA.md](./SCHEMA.md).

Single user, hardcoded login: **`Bhanu` / `Bhanu123`**.

## Stack

- **Frontend** — React 18 + Vite 5 + TypeScript + TailwindCSS + Framer Motion + TanStack Query + Recharts + date-fns + Lucide + react-hot-toast
- **Backend** — Python 3.11 + FastAPI + Supabase Python client + Pydantic v2
- **Database** — Supabase / PostgreSQL 15

## Repository Layout

```
GRIND/
├── SCHEMA.md
├── backend/                — FastAPI app
├── frontend/               — Vite React app
└── supabase/migrations/    — SQL migration
```

## Setup

### 1. Supabase

1. Create a Supabase project.
2. SQL Editor → paste `supabase/migrations/001_initial_schema.sql` → Run.
3. Copy your `Project URL`, `anon` key, and `service role` key.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
uvicorn main:app --reload --port 8000
```

API docs live at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm run dev
```

Open `http://localhost:5173` and log in with `Bhanu` / `Bhanu123`.

## Features

- **Home** — animated streak ring, progress bar, today's tasks grouped by Morning/Afternoon/Evening/Night, motivational tagline
- **Tasks** — full CRUD over habits with category filters and a bottom-sheet form
- **Insights** — top/bottom 5 habits, weekly trend, day-of-week averages, consistency table, 90-day heatmap, LeetCode + gym sub-analyses
- **Grind** — daily LeetCode logger (Easy/Medium/Hard), application counter, AWS study checklist, gym checklist
- **Settings** — streak threshold slider, JSON export, reset today, sign out

## PWA

The frontend is installable as a PWA (`Add to Home Screen`) — manifest in `frontend/public/manifest.json`, service worker at `frontend/public/sw.js`.

## License

Private. Built for Bhanu.
