import type { AppUser } from '@/src/features/user/domain/models/AppUser';

export type UserProfileStats = {
  totalPracticeSessions: number;
  totalPracticeTimeSeconds: number;
  totalAppTimeSeconds: number;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  streakDays: number;
  practicedKanaCount: number;
  masteredKanaCount: number;
  weakestKana: string[];
  strongestKana: string[];
  averageAccuracy: number;
  dailyGoal: UserDailyGoalProgress;
  weeklyActivity: UserWeeklyActivityDay[];
  recommendedKana: string[];
  practiceTip?: string;
  modeBreakdown: UserPracticeModeSummary[];
  recentSessions: UserRecentPracticeSession[];
};

export type UserDailyGoalProgress = {
  sessionsToday: number;
  minutesToday: number;
  targetLessons: number;
  targetMinutes: number;
  lessonsPercent: number;
  minutesPercent: number;
  completed: boolean;
};

export type UserWeeklyActivityDay = {
  date: string;
  totalSessions: number;
  durationSeconds: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
};

export type UserPracticeModeSummary = {
  mode: string;
  totalSessions: number;
  totalAttempts: number;
  correctAttempts: number;
  durationSeconds: number;
  accuracy: number;
};

export type UserRecentPracticeSession = {
  id: string;
  practiceMode: string;
  seriesTitle?: string;
  completedAt: string;
  durationSeconds: number;
  totalAttempts: number;
  correctAttempts: number;
  averageScore?: number;
};

export type UserProfileSummary = {
  user: AppUser;
  stats: UserProfileStats;
};
