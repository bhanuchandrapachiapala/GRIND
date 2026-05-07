export type CategoryName =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'general';

export interface Habit {
  id: number;
  name: string;
  scheduled_time: string;
  category: CategoryName;
  is_active: boolean;
  is_paused: boolean;
  sort_order: number;
  created_at: string;
}

export type Mood = 'great' | 'good' | 'neutral' | 'tough' | 'bad';

export interface DailyNote {
  id: number;
  date: string;
  note: string;
  mood: Mood;
  created_at: string;
  updated_at: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface LeetCodeProblem {
  id: number;
  date: string;
  problem_number: number;
  problem_name: string;
  difficulty: Difficulty;
  created_at: string;
}

export interface HabitChange {
  habit_id: number;
  name: string;
  this_week_pct: number;
  last_week_pct: number;
  change: number;
}

export interface WeeklyReview {
  week_start: string;
  week_end: string;
  this_week_avg_pct: number;
  last_week_avg_pct: number;
  pct_change: number;
  best_day: { date: string; pct: number } | null;
  worst_day: { date: string; pct: number } | null;
  most_improved_habits: HabitChange[];
  most_dropped_habits: HabitChange[];
  streak_at_end_of_week: number;
  total_leetcode: number;
  total_applications: number;
  gym_sessions: number;
}

export type ThemeMode = 'dark' | 'light';

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

export interface TopHabitsResponse {
  top5: HabitRank[];
  bottom5: HabitRank[];
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
  [key: string]: string;
}

export interface WeeklyTrendPoint {
  date: string;
  pct: number;
  completed: number;
  total: number;
}

export interface DayOfWeekPoint {
  day_name: string;
  avg_pct: number;
}

export interface LeetCodeInsightsResponse {
  total_easy: number;
  total_medium: number;
  total_hard: number;
  total_all: number;
  daily: { date: string; easy: number; medium: number; hard: number }[];
}

export interface GymInsightRow {
  exercise_name: string;
  category: string;
  count: number;
}
