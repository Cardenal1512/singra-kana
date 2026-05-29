import type { UserStatsRepository } from '@/src/features/user/domain/repositories/UserStatsRepository';

export class MockUserStatsRepository implements UserStatsRepository {
  async getSummaryByUserId() {
    return {
      practicedKanaCount: 0,
      masteredKanaCount: 0,
      totalAppTimeSeconds: 0,
      weakestKana: [],
      strongestKana: [],
      averageAccuracy: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      wrongAttempts: 0,
      dailyGoal: {
        sessionsToday: 0,
        minutesToday: 0,
        targetLessons: 1,
        targetMinutes: 10,
        lessonsPercent: 0,
        minutesPercent: 0,
        completed: false,
      },
      weeklyActivity: [],
      recommendedKana: [],
      practiceTip: undefined,
      modeBreakdown: [],
      recentSessions: [],
    };
  }
}
