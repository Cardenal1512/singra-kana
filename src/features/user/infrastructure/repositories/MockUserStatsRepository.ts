import type { UserStatsRepository } from '@/src/features/user/domain/repositories/UserStatsRepository';

export class MockUserStatsRepository implements UserStatsRepository {
  async getSummaryByUserId() {
    return {
      practicedKanaCount: 0,
      masteredKanaCount: 0,
      weakestKana: [],
    };
  }
}
