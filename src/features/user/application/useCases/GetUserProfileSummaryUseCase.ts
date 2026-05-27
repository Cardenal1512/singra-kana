import type { AppUser } from '@/src/features/user/domain/models/AppUser';
import type {
  UserProfileStats,
  UserProfileSummary,
} from '@/src/features/user/domain/models/UserProfileSummary';
import type { UserStatsRepository } from '@/src/features/user/domain/repositories/UserStatsRepository';

export class GetUserProfileSummaryUseCase {
  constructor(private readonly userStatsRepository: UserStatsRepository) {}

  async execute(user: AppUser): Promise<UserProfileSummary> {
    const stats = await this.userStatsRepository.getSummaryByUserId(user.id).catch(() => undefined);

    return {
      user,
      stats: {
        totalPracticeSessions: stats?.totalPracticeSessions ?? user.totalPracticeSessions,
        totalPracticeTimeSeconds: stats?.totalPracticeTimeSeconds ?? user.totalPracticeTimeSeconds,
        streakDays: stats?.streakDays ?? user.streakDays,
        practicedKanaCount: stats?.practicedKanaCount ?? 0,
        masteredKanaCount: stats?.masteredKanaCount ?? 0,
        weakestKana: stats?.weakestKana ?? [],
      },
    };
  }
}

export function hasProfileStats(stats: UserProfileStats) {
  return stats.totalPracticeSessions > 0
    || stats.totalPracticeTimeSeconds > 0
    || stats.streakDays > 0
    || stats.practicedKanaCount > 0
    || stats.masteredKanaCount > 0
    || stats.weakestKana.length > 0;
}
