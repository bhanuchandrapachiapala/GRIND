-- ══════════════════════════════════════════════════════════════════
-- GRIND v2 — Upgrade Migration
-- Run AFTER 001_initial_schema.sql
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
DROP TRIGGER IF EXISTS daily_notes_updated_at ON daily_notes;
CREATE TRIGGER daily_notes_updated_at
  BEFORE UPDATE ON daily_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 5. RLS for new tables ──
ALTER TABLE daily_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leetcode_problems  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_daily_notes" ON daily_notes;
CREATE POLICY "anon_all_daily_notes"
  ON daily_notes FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_leetcode_problems" ON leetcode_problems;
CREATE POLICY "anon_all_leetcode_problems"
  ON leetcode_problems FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── 6. New settings defaults ──
INSERT INTO settings (key, value) VALUES
  ('theme', 'dark'),
  ('notifications_enabled', 'false'),
  ('notification_lead_minutes', '5')
ON CONFLICT (key) DO NOTHING;
