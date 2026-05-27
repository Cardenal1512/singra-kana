import type { UserProfileStats } from '@/src/features/user/domain/models/UserProfileSummary';

export interface UserStatsRepository {
  getSummaryByUserId(userId: string): Promise<Partial<UserProfileStats> | undefined>;
}
