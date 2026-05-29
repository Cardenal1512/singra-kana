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
        totalAppTimeSeconds: stats?.totalAppTimeSeconds ?? user.totalAppTimeSeconds,
        totalAttempts: stats?.totalAttempts ?? 0,
        correctAttempts: stats?.correctAttempts ?? 0,
        wrongAttempts: stats?.wrongAttempts ?? 0,
        streakDays: stats?.streakDays ?? user.streakDays,
        practicedKanaCount: stats?.practicedKanaCount ?? 0,
        masteredKanaCount: stats?.masteredKanaCount ?? 0,
        weakestKana: stats?.weakestKana ?? [],
        strongestKana: stats?.strongestKana ?? [],
        averageAccuracy: stats?.averageAccuracy ?? 0,
        dailyGoal: stats?.dailyGoal ?? getEmptyDailyGoal(user),
        weeklyActivity: stats?.weeklyActivity ?? [],
        recommendedKana: stats?.recommendedKana ?? [],
        practiceTip: stats?.practiceTip,
        modeBreakdown: stats?.modeBreakdown ?? [],
        recentSessions: stats?.recentSessions ?? [],
      },
    };
  }
}

export function hasProfileStats(stats: UserProfileStats) {
  return stats.totalPracticeSessions > 0
    || stats.totalPracticeTimeSeconds > 0
    || stats.totalAppTimeSeconds > 0
    || stats.totalAttempts > 0
    || stats.streakDays > 0
    || stats.practicedKanaCount > 0
    || stats.masteredKanaCount > 0
    || stats.averageAccuracy > 0
    || stats.weakestKana.length > 0
    || stats.strongestKana.length > 0
    || stats.dailyGoal.sessionsToday > 0
    || stats.dailyGoal.minutesToday > 0
    || stats.weeklyActivity.some((day) => day.totalSessions > 0 || day.totalAttempts > 0)
    || stats.recommendedKana.length > 0
    || stats.modeBreakdown.length > 0
    || stats.recentSessions.length > 0;
}

function getEmptyDailyGoal(user: AppUser) {
  return {
    sessionsToday: 0,
    minutesToday: 0,
    targetLessons: user.dailyGoalLessons,
    targetMinutes: user.dailyGoalMinutes,
    lessonsPercent: 0,
    minutesPercent: 0,
    completed: false,
  };
}
