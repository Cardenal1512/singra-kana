import type { AppUser } from '@/src/features/user/domain/models/AppUser';

export type UserProfileStats = {
  totalPracticeSessions: number;
  totalPracticeTimeSeconds: number;
  streakDays: number;
  practicedKanaCount: number;
  masteredKanaCount: number;
  weakestKana: string[];
};

export type UserProfileSummary = {
  user: AppUser;
  stats: UserProfileStats;
};
