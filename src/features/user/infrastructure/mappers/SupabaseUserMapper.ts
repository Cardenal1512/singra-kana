import type {
  AppUser,
  AppUserLevel,
  AppUserSyllabary,
  UpdateUserProfileInput,
} from '@/src/features/user/domain/models/AppUser';

export type SupabaseAppUserRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_key: string | null;
  preferred_language: string;
  current_syllabary: string;
  current_level: string;
  daily_goal_minutes: number;
  daily_goal_lessons: number;
  streak_days: number;
  total_practice_days: number;
  total_practice_sessions: number;
  total_practice_time_seconds: number;
  last_practiced_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseAppUserUpdateRow = Partial<{
  avatar_key: string | null;
  current_level: AppUserLevel;
  current_syllabary: AppUserSyllabary;
  daily_goal_lessons: number;
  daily_goal_minutes: number;
  display_name: string;
  preferred_language: string;
  updated_at: string;
}>;

export function mapSupabaseAppUserRowToDomain(row: SupabaseAppUserRow): AppUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarKey: row.avatar_key ?? undefined,
    preferredLanguage: row.preferred_language,
    currentSyllabary: normalizeSyllabary(row.current_syllabary),
    currentLevel: normalizeLevel(row.current_level),
    dailyGoalMinutes: row.daily_goal_minutes,
    dailyGoalLessons: row.daily_goal_lessons,
    streakDays: row.streak_days,
    totalPracticeDays: row.total_practice_days,
    totalPracticeSessions: row.total_practice_sessions,
    totalPracticeTimeSeconds: row.total_practice_time_seconds,
    lastPracticedAt: row.last_practiced_at ?? undefined,
    lastSeenAt: row.last_seen_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUpdateUserProfileInputToSupabaseRow(
  input: UpdateUserProfileInput,
): SupabaseAppUserUpdateRow {
  return {
    avatar_key: input.avatarKey,
    current_level: input.currentLevel,
    current_syllabary: input.currentSyllabary,
    daily_goal_lessons: input.dailyGoalLessons,
    daily_goal_minutes: input.dailyGoalMinutes,
    display_name: input.displayName,
    preferred_language: input.preferredLanguage,
    updated_at: new Date().toISOString(),
  };
}

function normalizeSyllabary(value: string): AppUserSyllabary {
  return value === 'katakana' || value === 'kanji' ? value : 'hiragana';
}

function normalizeLevel(value: string): AppUserLevel {
  return value === 'intermediate' || value === 'advanced' ? value : 'beginner';
}
