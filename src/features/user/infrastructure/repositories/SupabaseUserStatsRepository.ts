import type { SupabaseClient } from '@supabase/supabase-js';

import type { UserProfileStats } from '@/src/features/user/domain/models/UserProfileSummary';
import type { UserStatsRepository } from '@/src/features/user/domain/repositories/UserStatsRepository';

type KanaProgressRow = {
  kana: string;
  attempts_count: number;
  correct_count: number;
  wrong_count: number;
  mastered: boolean;
  average_score: number | null;
  last_practiced_at: string | null;
};

type PracticeSessionRow = {
  id: string;
  practice_mode: string;
  series_title: string | null;
  completed_at: string;
  correct_attempts: number;
  wrong_attempts: number;
  duration_seconds: number;
  total_attempts: number;
  average_score: number | null;
};

export class SupabaseUserStatsRepository implements UserStatsRepository {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async getSummaryByUserId(userId: string): Promise<Partial<UserProfileStats> | undefined> {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    const [
      { data: user, error: userError },
      { data: usageSessions, error: usageError },
      { data: kanaProgress, error: kanaProgressError },
      { data: sessions, error: sessionsError },
    ] =
      await Promise.all([
        this.client
          .from('app_user')
          .select('daily_goal_minutes,daily_goal_lessons')
          .eq('id', userId)
          .maybeSingle(),
        this.client
          .from('app_usage_session')
          .select('duration_seconds')
          .eq('user_id', userId),
        this.client
          .from('kana_progress')
          .select('kana,attempts_count,correct_count,wrong_count,mastered,average_score,last_practiced_at')
          .eq('user_id', userId),
        this.client
          .from('practice_session')
          .select('id,practice_mode,series_title,completed_at,total_attempts,correct_attempts,wrong_attempts,duration_seconds,average_score')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false }),
      ]);

    if (userError) {
      throw userError;
    }

    if (kanaProgressError) {
      throw kanaProgressError;
    }

    if (sessionsError) {
      throw sessionsError;
    }

    const kanaRows = (kanaProgress ?? []) as KanaProgressRow[];
    const sessionRows = (sessions ?? []) as PracticeSessionRow[];
    const totalAppTimeSeconds = usageError ? 0 : (usageSessions ?? []).reduce(
      (sum, session) => sum + (typeof session.duration_seconds === 'number' ? session.duration_seconds : 0),
      0,
    );
    const totalAttempts = sessionRows.reduce((sum, session) => sum + session.total_attempts, 0);
    const correctAttempts = sessionRows.reduce((sum, session) => sum + session.correct_attempts, 0);
    const wrongAttempts = sessionRows.reduce((sum, session) => sum + session.wrong_attempts, 0);
    const weakestKana = [...kanaRows]
      .filter((row) => row.attempts_count > 0)
      .sort((first, second) => {
        const firstAccuracy = first.correct_count / Math.max(1, first.attempts_count);
        const secondAccuracy = second.correct_count / Math.max(1, second.attempts_count);

        if (second.wrong_count !== first.wrong_count) {
          return second.wrong_count - first.wrong_count;
        }

        return firstAccuracy - secondAccuracy;
      })
      .slice(0, 3)
      .map((row) => row.kana);
    const strongestKana = [...kanaRows]
      .filter((row) => row.attempts_count >= 2)
      .sort((first, second) => {
        const firstAccuracy = first.correct_count / Math.max(1, first.attempts_count);
        const secondAccuracy = second.correct_count / Math.max(1, second.attempts_count);

        if (secondAccuracy !== firstAccuracy) {
          return secondAccuracy - firstAccuracy;
        }

        return (second.average_score ?? 0) - (first.average_score ?? 0);
      })
      .slice(0, 3)
      .map((row) => row.kana);
    const recommendedKana = getRecommendedKana(kanaRows, weakestKana);
    const weeklyActivity = getWeeklyActivity(sessionRows);
    const todayKey = toDateKey(new Date());
    const todaySessions = sessionRows.filter((session) => toDateKey(new Date(session.completed_at)) === todayKey);
    const minutesToday = Math.round(todaySessions.reduce((sum, session) => sum + session.duration_seconds, 0) / 60);
    const targetLessons = getPositiveNumber(user?.daily_goal_lessons, 1);
    const targetMinutes = getPositiveNumber(user?.daily_goal_minutes, 10);
    const lessonsPercent = getPercent(todaySessions.length, targetLessons);
    const minutesPercent = getPercent(minutesToday, targetMinutes);
    const modeBreakdown = Array.from(
      sessionRows.reduce((modes, session) => {
        const current = modes.get(session.practice_mode) ?? {
          mode: session.practice_mode,
          totalSessions: 0,
          totalAttempts: 0,
          correctAttempts: 0,
          durationSeconds: 0,
          accuracy: 0,
        };

        current.totalSessions += 1;
        current.totalAttempts += session.total_attempts;
        current.correctAttempts += session.correct_attempts;
        current.durationSeconds += session.duration_seconds;
        current.accuracy = current.totalAttempts > 0
          ? Math.round((current.correctAttempts / current.totalAttempts) * 100)
          : 0;

        modes.set(session.practice_mode, current);
        return modes;
      }, new Map<string, UserProfileStats['modeBreakdown'][number]>()),
    ).map(([, value]) => value);

    return {
      totalPracticeSessions: sessionRows.length,
      totalPracticeTimeSeconds: sessionRows.reduce((sum, session) => sum + session.duration_seconds, 0),
      totalAppTimeSeconds,
      totalAttempts,
      correctAttempts,
      wrongAttempts,
      practicedKanaCount: kanaRows.filter((row) => row.attempts_count > 0).length,
      masteredKanaCount: kanaRows.filter((row) => row.mastered).length,
      weakestKana,
      strongestKana,
      averageAccuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      dailyGoal: {
        sessionsToday: todaySessions.length,
        minutesToday,
        targetLessons,
        targetMinutes,
        lessonsPercent,
        minutesPercent,
        completed: lessonsPercent >= 100 || minutesPercent >= 100,
      },
      weeklyActivity,
      recommendedKana,
      practiceTip: getPracticeTip({
        averageAccuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
        dailyGoalCompleted: lessonsPercent >= 100 || minutesPercent >= 100,
        recommendedKana,
        streakDays: weeklyActivity.filter((day) => day.totalSessions > 0).length,
      }),
      modeBreakdown,
      recentSessions: sessionRows.slice(0, 5).map((session) => ({
        id: session.id,
        practiceMode: session.practice_mode,
        seriesTitle: session.series_title ?? undefined,
        completedAt: session.completed_at,
        durationSeconds: session.duration_seconds,
        totalAttempts: session.total_attempts,
        correctAttempts: session.correct_attempts,
        averageScore: session.average_score ?? undefined,
      })),
    };
  }
}

function getRecommendedKana(kanaRows: KanaProgressRow[], weakestKana: string[]) {
  const weak = weakestKana.slice(0, 3);
  const almostMastered = [...kanaRows]
    .filter((row) => row.attempts_count > 0 && !row.mastered)
    .sort((first, second) => {
      const firstAccuracy = first.correct_count / Math.max(1, first.attempts_count);
      const secondAccuracy = second.correct_count / Math.max(1, second.attempts_count);

      if (firstAccuracy !== secondAccuracy) {
        return firstAccuracy - secondAccuracy;
      }

      return (first.last_practiced_at ?? '').localeCompare(second.last_practiced_at ?? '');
    })
    .map((row) => row.kana);

  return Array.from(new Set([...weak, ...almostMastered])).slice(0, 5);
}

function getWeeklyActivity(sessionRows: PracticeSessionRow[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      date: toDateKey(date),
      totalSessions: 0,
      durationSeconds: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
    };
  });
  const daysByKey = new Map(days.map((day) => [day.date, day]));

  for (const session of sessionRows) {
    const day = daysByKey.get(toDateKey(new Date(session.completed_at)));

    if (!day) {
      continue;
    }

    day.totalSessions += 1;
    day.durationSeconds += session.duration_seconds;
    day.totalAttempts += session.total_attempts;
    day.correctAttempts += session.correct_attempts;
    day.accuracy = day.totalAttempts > 0
      ? Math.round((day.correctAttempts / day.totalAttempts) * 100)
      : 0;
  }

  return days;
}

function getPracticeTip({
  averageAccuracy,
  dailyGoalCompleted,
  recommendedKana,
  streakDays,
}: {
  averageAccuracy: number;
  dailyGoalCompleted: boolean;
  recommendedKana: string[];
  streakDays: number;
}) {
  if (dailyGoalCompleted) {
    return 'Objetivo de hoy completado. Repaso suave y listo.';
  }

  if (recommendedKana.length > 0) {
    return `Hoy conviene repasar ${recommendedKana.slice(0, 3).join(' · ')}.`;
  }

  if (averageAccuracy >= 85 && streakDays >= 3) {
    return 'Vas muy bien. Prueba una serie nueva.';
  }

  return 'Una practica corta mantiene la racha viva.';
}

function getPercent(value: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / target) * 100));
}

function getPositiveNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
