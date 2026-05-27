export type AppUserSyllabary = 'hiragana' | 'katakana' | 'kanji';

export type AppUserLevel = 'beginner' | 'intermediate' | 'advanced';

export type AppUser = {
  id: string;
  username: string;
  displayName: string;
  avatarKey?: string;
  preferredLanguage: string;
  currentSyllabary: AppUserSyllabary;
  currentLevel: AppUserLevel;
  dailyGoalMinutes: number;
  dailyGoalLessons: number;
  streakDays: number;
  totalPracticeDays: number;
  totalPracticeSessions: number;
  totalPracticeTimeSeconds: number;
  lastPracticedAt?: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserProfileInput = {
  avatarKey?: string | null;
  currentLevel?: AppUserLevel;
  currentSyllabary?: AppUserSyllabary;
  dailyGoalLessons?: number;
  dailyGoalMinutes?: number;
  displayName?: string;
  preferredLanguage?: string;
};
