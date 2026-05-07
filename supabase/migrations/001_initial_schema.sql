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
CREATE INDEX IF NOT EXISTS idx_habits_sort_order ON habits(sort_order);

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

DROP TRIGGER IF EXISTS grind_log_updated_at ON grind_log;
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
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['habits','habit_completions','grind_log','gym_exercises','gym_completions','aws_topics','settings']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_all_%s" ON %s', t, t);
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
