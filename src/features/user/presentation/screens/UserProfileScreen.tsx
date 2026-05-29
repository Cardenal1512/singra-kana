import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  GetUserProfileSummaryUseCase,
  hasProfileStats,
} from '@/src/features/user/application/useCases/GetUserProfileSummaryUseCase';
import type { AppUser } from '@/src/features/user/domain/models/AppUser';
import type {
  UserProfileStats,
  UserProfileSummary,
} from '@/src/features/user/domain/models/UserProfileSummary';
import { createUserStatsRepository } from '@/src/features/user/infrastructure/repositories/createUserStatsRepository';
import { useUserSession } from '@/src/features/user/presentation/context/UserSessionContext';
import { getMascotImage } from '@/src/shared/assets/imageRegistry';
import { playSound } from '@/src/shared/audio/AudioService';
import { AnimatedSingra } from '@/src/shared/components/AnimatedSingra';
import { AppButton } from '@/src/shared/components/AppButton';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useTranslation } from '@/src/shared/i18n/useTranslation';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type UserProfileScreenProps = {
  showBackButton?: boolean;
  onBack: () => void;
};

type CompactUserDataItem = {
  icon: string;
  label: string;
  value: string;
};

export function UserProfileScreen({ showBackButton = true, onBack }: UserProfileScreenProps) {
  const { language } = useTranslation();
  const { currentUser, isFallback, logout } = useUserSession();
  const { isMobile, width } = useResponsiveLayout();
  const [summary, setSummary] = useState<UserProfileSummary | undefined>();
  const [softError, setSoftError] = useState<string | undefined>();
  const userStatsRepository = useMemo(() => createUserStatsRepository(), []);
  const contentWidth = Math.min(width - (isMobile ? 28 : 48), 760);
  const user = summary?.user ?? currentUser;
  const stats = summary?.stats ?? getEmptyStats(user);
  const hasStats = hasProfileStats(stats);
  const singraImage = getMascotImage('singraGambate') ?? getMascotImage('singraHome');

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      if (!currentUser) {
        return;
      }

      try {
        const useCase = new GetUserProfileSummaryUseCase(userStatsRepository);
        const nextSummary = await useCase.execute(currentUser);

        if (isMounted) {
          setSummary(nextSummary);
          setSoftError(undefined);
        }
      } catch {
        if (isMounted) {
          setSummary({
            user: currentUser,
            stats: getEmptyStats(currentUser),
          });
          setSoftError(
            language === 'es'
              ? 'No se pudieron actualizar los datos ahora.'
              : 'Could not refresh profile data right now.',
          );
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [currentUser, language, userStatsRepository]);

  async function handleLogout() {
    await logout();
  }

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={['プロフィール', user?.username ?? 'Adri', '学']} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { width: contentWidth }]}>
          <ProfileHeader
            language={language}
            showBackButton={showBackButton}
            singraImage={singraImage}
            user={user}
            onBack={onBack}
          />

          {softError || isFallback ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                {softError
                  ?? (language === 'es'
                    ? 'Mostrando datos locales.'
                    : 'Showing local data.')}
              </Text>
            </View>
          ) : null}

          <ProgressSummaryCard language={language} stats={stats} user={user} />

          <DailyGoalCard language={language} stats={stats} />

          <StatsGrid language={language} stats={stats} />

          {hasStats ? <PracticeInsightsSection language={language} stats={stats} /> : null}

          {!hasStats ? (
            <EmptyStatsCard language={language} singraImage={singraImage} />
          ) : null}

          <CompactUserDataSection
            items={[
              {
                icon: 'あ',
                label: language === 'es' ? 'Silabario actual' : 'Current syllabary',
                value: user?.currentSyllabary ?? 'hiragana',
              },
              {
                icon: '文',
                label: language === 'es' ? 'Idioma preferido' : 'Preferred language',
                value: user?.preferredLanguage ?? 'es',
              },
              {
                icon: '⏳',
                label: language === 'es' ? 'Tiempo en app' : 'App time',
                value: formatPracticeTime(stats.totalAppTimeSeconds, language),
              },
              {
                icon: '⏱',
                label: language === 'es' ? 'Ultima conexion' : 'Last seen',
                value: formatDate(user?.lastSeenAt, language),
              },
              {
                icon: '✦',
                label: language === 'es' ? 'Cuenta creada' : 'Created',
                value: formatDate(user?.createdAt, language),
              },
            ]}
            language={language}
          />

          <View style={styles.actions}>
            <AppButton
              label={language === 'es' ? 'Cerrar sesion' : 'Log out'}
              onPress={handleLogout}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileHeader({
  language,
  showBackButton,
  singraImage,
  user,
  onBack,
}: {
  language: 'en' | 'es';
  showBackButton: boolean;
  singraImage?: ReturnType<typeof getMascotImage>;
  user?: AppUser;
  onBack: () => void;
}) {
  const handleBack = () => {
    playSound('tap');
    onBack();
  };

  return (
    <View style={styles.headerWrap}>
      {showBackButton ? (
        <Pressable accessibilityRole="button" onPress={handleBack} style={styles.backPill}>
          <Text style={styles.backPillText}>{language === 'es' ? 'Volver' : 'Back'}</Text>
        </Pressable>
      ) : null}

      <View style={styles.profileHeaderCard}>
        <View style={styles.profileMain}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(user?.displayName)}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.displayName}>{user?.displayName ?? 'Adri'}</Text>
            <Text style={styles.username}>@{user?.username ?? 'adri'}</Text>
            <Text style={styles.japanesePhrase}>「今日もれんしゅうしよう！」</Text>
            <Text style={styles.dailyHint}>
              {language === 'es'
                ? 'Hoy toca practicar un poco ✨'
                : 'A little practice today ✨'}
            </Text>
          </View>
        </View>

        {singraImage ? (
          <View style={styles.headerSingra}>
            <AnimatedSingra mood="idle" size={82} source={singraImage} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ProgressSummaryCard({
  language,
  stats,
  user,
}: {
  language: 'en' | 'es';
  stats: UserProfileStats;
  user?: AppUser;
}) {
  const progressPercent = getProgressPercent(stats);

  return (
    <View style={styles.progressCard}>
      <Text style={styles.cardTitle}>📈 {language === 'es' ? 'Tu progreso' : 'Your progress'}</Text>

      <View style={styles.progressBody}>
        <View style={styles.progressRingOuter}>
          <View style={styles.progressRingInner}>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
            <Text style={styles.progressCaption}>
              {language === 'es' ? 'progreso' : 'progress'}
            </Text>
          </View>
        </View>

        <View style={styles.progressFacts}>
          <ProgressFact
            label={language === 'es' ? 'Kana practicados' : 'Practiced kana'}
            value={String(stats.practicedKanaCount)}
          />
          <ProgressFact
            label={language === 'es' ? 'Silabario' : 'Syllabary'}
            value={user?.currentSyllabary ?? 'hiragana'}
          />
          <ProgressFact
            label={language === 'es' ? 'Idioma' : 'Language'}
            value={user?.preferredLanguage ?? 'es'}
          />
        </View>
      </View>
    </View>
  );
}

function ProgressFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.progressFact}>
      <Text style={styles.progressFactValue}>{value}</Text>
      <Text style={styles.progressFactLabel}>{label}</Text>
    </View>
  );
}

function DailyGoalCard({ language, stats }: { language: 'en' | 'es'; stats: UserProfileStats }) {
  const targetCopy = language === 'es'
    ? `${stats.dailyGoal.sessionsToday}/${stats.dailyGoal.targetLessons} sesiones · ${stats.dailyGoal.minutesToday}/${stats.dailyGoal.targetMinutes} min`
    : `${stats.dailyGoal.sessionsToday}/${stats.dailyGoal.targetLessons} sessions · ${stats.dailyGoal.minutesToday}/${stats.dailyGoal.targetMinutes} min`;

  return (
    <View style={styles.dailyGoalCard}>
      <View style={styles.dailyGoalHeader}>
        <View style={styles.dailyGoalBadge}>
          <Text style={styles.dailyGoalBadgeText}>{stats.dailyGoal.completed ? 'OK' : 'GO'}</Text>
        </View>
        <View style={styles.dailyGoalCopy}>
          <Text style={styles.dailyGoalTitle}>
            {language === 'es' ? 'Objetivo de hoy' : 'Today goal'}
          </Text>
          <Text style={styles.dailyGoalSubtitle}>{targetCopy}</Text>
        </View>
      </View>

      <View style={styles.goalBars}>
        <GoalBar
          label={language === 'es' ? 'Lecciones' : 'Lessons'}
          percent={stats.dailyGoal.lessonsPercent}
        />
        <GoalBar
          label={language === 'es' ? 'Minutos' : 'Minutes'}
          percent={stats.dailyGoal.minutesPercent}
        />
      </View>

      {stats.practiceTip ? (
        <Text style={styles.practiceTip}>{stats.practiceTip}</Text>
      ) : null}
    </View>
  );
}

function GoalBar({ label, percent }: { label: string; percent: number }) {
  return (
    <View style={styles.goalBarWrap}>
      <View style={styles.goalBarLabelRow}>
        <Text style={styles.goalBarLabel}>{label}</Text>
        <Text style={styles.goalBarPercent}>{percent}%</Text>
      </View>
      <View style={styles.goalBarTrack}>
        <View style={[styles.goalBarFill, { width: `${Math.max(4, percent)}%` }]} />
      </View>
    </View>
  );
}

function StatsGrid({ language, stats }: { language: 'en' | 'es'; stats: UserProfileStats }) {
  const accuracy = Math.round(stats.averageAccuracy);

  return (
    <View style={styles.statsGrid}>
      <StatMiniCard
        backgroundColor="#FFF0C8"
        icon="🔥"
        label={language === 'es' ? 'Racha actual' : 'Current streak'}
        value={String(stats.streakDays)}
      />
      <StatMiniCard
        backgroundColor="#EAF4F7"
        icon="⏱"
        label={language === 'es' ? 'Tiempo practicado' : 'Practice time'}
        value={formatPracticeTime(stats.totalPracticeTimeSeconds, language)}
      />
      <StatMiniCard
        backgroundColor="#F8E8E4"
        icon="✍️"
        label={language === 'es' ? 'Kana practicados' : 'Practiced kana'}
        value={String(stats.practicedKanaCount)}
      />
      <StatMiniCard
        backgroundColor="#EDF6E8"
        icon="🎯"
        label={language === 'es' ? 'Precision media' : 'Average accuracy'}
        value={`${accuracy}%`}
      />
      <StatMiniCard
        backgroundColor="#F2EAF7"
        icon="✓"
        label={language === 'es' ? 'Aciertos' : 'Correct'}
        value={`${stats.correctAttempts}/${stats.totalAttempts}`}
      />
      <StatMiniCard
        backgroundColor="#FFF7DB"
        icon="!"
        label={language === 'es' ? 'Fallos' : 'Misses'}
        value={String(stats.wrongAttempts)}
      />
    </View>
  );
}

function StatMiniCard({
  backgroundColor,
  icon,
  label,
  value,
}: {
  backgroundColor: string;
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.statMiniCard, { backgroundColor }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PracticeInsightsSection({
  language,
  stats,
}: {
  language: 'en' | 'es';
  stats: UserProfileStats;
}) {
  return (
    <View style={styles.insightsSection}>
      <Text style={styles.compactTitle}>
        {language === 'es' ? 'Detalles de práctica' : 'Practice details'}
      </Text>

      <View style={styles.kanaInsightGrid}>
        <KanaInsightCard
          kana={stats.strongestKana}
          label={language === 'es' ? 'Más fuertes' : 'Strongest'}
        />
        <KanaInsightCard
          kana={stats.weakestKana}
          label={language === 'es' ? 'A reforzar' : 'Needs work'}
        />
      </View>

      {stats.recommendedKana.length > 0 ? (
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationLabel}>
            {language === 'es' ? 'Siguiente repaso' : 'Next review'}
          </Text>
          <View style={styles.kanaPillRow}>
            {stats.recommendedKana.map((item) => (
              <Text key={item} style={styles.kanaPill}>{item}</Text>
            ))}
          </View>
        </View>
      ) : null}

      {stats.weeklyActivity.length > 0 ? (
        <WeeklyActivityCard language={language} stats={stats} />
      ) : null}

      {stats.modeBreakdown.length > 0 ? (
        <View style={styles.modeList}>
          {stats.modeBreakdown.map((mode) => (
            <View key={mode.mode} style={styles.modeRow}>
              <View style={styles.modeCopy}>
                <Text style={styles.modeTitle}>{formatModeLabel(mode.mode, language)}</Text>
                <Text style={styles.modeSubtitle}>
                  {mode.totalSessions} {language === 'es' ? 'sesiones' : 'sessions'} ·{' '}
                  {formatPracticeTime(mode.durationSeconds, language)}
                </Text>
              </View>
              <Text style={styles.modeAccuracy}>{mode.accuracy}%</Text>
            </View>
          ))}
        </View>
      ) : null}

      {stats.recentSessions.length > 0 ? (
        <View style={styles.recentList}>
          <Text style={styles.recentTitle}>
            {language === 'es' ? 'Últimas sesiones' : 'Recent sessions'}
          </Text>
          {stats.recentSessions.map((session) => (
            <View key={session.id} style={styles.recentRow}>
              <View style={styles.modeCopy}>
                <Text style={styles.modeTitle}>
                  {session.seriesTitle ?? formatModeLabel(session.practiceMode, language)}
                </Text>
                <Text style={styles.modeSubtitle}>
                  {formatDate(session.completedAt, language)}
                </Text>
              </View>
              <Text style={styles.modeAccuracy}>
                {session.totalAttempts > 0
                  ? Math.round((session.correctAttempts / session.totalAttempts) * 100)
                  : session.averageScore ?? 0}%
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function KanaInsightCard({ kana, label }: { kana: string[]; label: string }) {
  return (
    <View style={styles.kanaInsightCard}>
      <Text style={styles.kanaInsightLabel}>{label}</Text>
      <View style={styles.kanaPillRow}>
        {kana.length > 0 ? kana.map((item) => (
          <Text key={item} style={styles.kanaPill}>{item}</Text>
        )) : <Text style={styles.emptyKanaInsight}>-</Text>}
      </View>
    </View>
  );
}

function WeeklyActivityCard({
  language,
  stats,
}: {
  language: 'en' | 'es';
  stats: UserProfileStats;
}) {
  const maxSessions = Math.max(1, ...stats.weeklyActivity.map((day) => day.totalSessions));

  return (
    <View style={styles.weeklyCard}>
      <View style={styles.weeklyHeader}>
        <Text style={styles.weeklyTitle}>
          {language === 'es' ? 'Ultimos 7 dias' : 'Last 7 days'}
        </Text>
        <Text style={styles.weeklySubtitle}>
          {stats.weeklyActivity.reduce((sum, day) => sum + day.totalSessions, 0)}{' '}
          {language === 'es' ? 'sesiones' : 'sessions'}
        </Text>
      </View>
      <View style={styles.weeklyBars}>
        {stats.weeklyActivity.map((day) => (
          <View key={day.date} style={styles.weeklyDay}>
            <View style={styles.weeklyBarTrack}>
              <View
                style={[
                  styles.weeklyBarFill,
                  { height: `${Math.max(8, (day.totalSessions / maxSessions) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.weeklyDayLabel}>{formatShortWeekday(day.date, language)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyStatsCard({
  language,
  singraImage,
}: {
  language: 'en' | 'es';
  singraImage?: ReturnType<typeof getMascotImage>;
}) {
  return (
    <View style={styles.emptyStatsCard}>
      {singraImage ? (
        <View style={styles.emptySingra}>
          <AnimatedSingra mood="happy" size={72} source={singraImage} />
        </View>
      ) : null}
      <View style={styles.emptyCopy}>
        <Text style={styles.emptyTitle}>
          {language === 'es'
            ? 'Todavia no hay practica registrada'
            : 'No practice recorded yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {language === 'es'
            ? 'Haz tu primera sesion y volvere con tus resultados 📮'
            : 'Finish your first session and I will bring your results 📮'}
        </Text>
      </View>
    </View>
  );
}

function CompactUserDataSection({
  items,
  language,
}: {
  items: CompactUserDataItem[];
  language: 'en' | 'es';
}) {
  return (
    <View style={styles.compactSection}>
      <Text style={styles.compactTitle}>
        {language === 'es' ? 'Datos de cuenta' : 'Account details'}
      </Text>
      <View style={styles.compactList}>
        {items.map((item) => (
          <View key={item.label} style={styles.compactRow}>
            <View style={styles.compactLeft}>
              <Text style={styles.compactIcon}>{item.icon}</Text>
              <Text style={styles.compactLabel}>{item.label}</Text>
            </View>
            <Text style={styles.compactValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function getEmptyStats(user?: AppUser): UserProfileStats {
  return {
    totalPracticeSessions: user?.totalPracticeSessions ?? 0,
    totalPracticeTimeSeconds: user?.totalPracticeTimeSeconds ?? 0,
    totalAppTimeSeconds: user?.totalAppTimeSeconds ?? 0,
    totalAttempts: 0,
    correctAttempts: 0,
    wrongAttempts: 0,
    streakDays: user?.streakDays ?? 0,
    practicedKanaCount: 0,
    masteredKanaCount: 0,
    weakestKana: [],
    strongestKana: [],
    averageAccuracy: 0,
    dailyGoal: {
      sessionsToday: 0,
      minutesToday: 0,
      targetLessons: user?.dailyGoalLessons ?? 1,
      targetMinutes: user?.dailyGoalMinutes ?? 10,
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

function getProgressPercent(stats: UserProfileStats) {
  if (stats.practicedKanaCount <= 0) {
    return 0;
  }

  return Math.round((stats.masteredKanaCount / stats.practicedKanaCount) * 100);
}

function getInitial(value?: string) {
  return value?.trim().charAt(0).toUpperCase() || 'A';
}

function formatDate(value: string | undefined, language: 'en' | 'es') {
  if (!value) {
    return '-';
  }

  try {
    return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatPracticeTime(seconds: number, language: 'en' | 'es') {
  if (seconds <= 0) {
    return language === 'es' ? '0 min' : '0 min';
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}

function formatShortWeekday(dateKey: string, language: 'en' | 'es') {
  try {
    return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
    }).format(new Date(`${dateKey}T00:00:00.000Z`)).slice(0, 2);
  } catch {
    return dateKey.slice(5);
  }
}

function formatModeLabel(mode: string, language: 'en' | 'es') {
  const labels: Record<string, { en: string; es: string }> = {
    'romaji-quiz': { en: 'Romaji quiz', es: 'Romaji' },
    'vocabulary-image': { en: 'Vocabulary', es: 'Vocabulario' },
    'writing-memory': { en: 'Memory writing', es: 'Memoria' },
    'writing-trace': { en: 'Writing', es: 'Escritura' },
  };

  return labels[mode]?.[language] ?? mode;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 26,
    paddingHorizontal: 14,
    paddingTop: 58,
  },
  content: {
    gap: 14,
  },
  headerWrap: {
    gap: 10,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 7,
    ...softShadow,
  },
  backPillText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  profileHeaderCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 142,
    padding: 16,
    ...softShadow,
  },
  profileMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 13,
    minWidth: 0,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: '#F2D6A8',
    borderRadius: radii.pill,
    borderWidth: 4,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 31,
    fontWeight: '900',
  },
  identityCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  displayName: {
    color: colors.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: 0,
  },
  username: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  japanesePhrase: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 7,
  },
  dailyHint: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '800',
  },
  headerSingra: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    width: 86,
  },
  notice: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  noticeText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...softShadow,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  progressBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  progressRingOuter: {
    alignItems: 'center',
    backgroundColor: '#F5D36D',
    borderColor: '#E7B848',
    borderRadius: 999,
    borderWidth: 1,
    height: 118,
    justifyContent: 'center',
    width: 118,
  },
  progressRingInner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#FFF0C8',
    borderRadius: 999,
    borderWidth: 8,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  progressPercent: {
    color: colors.primary,
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 31,
  },
  progressCaption: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '900',
  },
  progressFacts: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  progressFact: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  progressFactValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  progressFactLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '900',
  },
  dailyGoalCard: {
    backgroundColor: '#FFF7DB',
    borderColor: '#E7B848',
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    ...softShadow,
  },
  dailyGoalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  dailyGoalBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  dailyGoalBadgeText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  dailyGoalCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  dailyGoalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  dailyGoalSubtitle: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
  },
  goalBars: {
    gap: 8,
  },
  goalBarWrap: {
    gap: 5,
  },
  goalBarLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalBarLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  goalBarPercent: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  goalBarTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 999,
    height: 12,
    overflow: 'hidden',
  },
  goalBarFill: {
    backgroundColor: '#F5B83B',
    borderRadius: 999,
    height: '100%',
  },
  practiceTip: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statMiniCard: {
    borderColor: 'rgba(120, 96, 70, 0.16)',
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 128,
    padding: 14,
    ...softShadow,
  },
  statIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  statValue: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    marginTop: 3,
  },
  insightsSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    ...softShadow,
  },
  kanaInsightGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  kanaInsightCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 86,
    padding: 12,
  },
  kanaInsightLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
  },
  kanaPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kanaPill: {
    backgroundColor: '#FFF0C8',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    minWidth: 34,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    textAlign: 'center',
  },
  emptyKanaInsight: {
    color: colors.disabledText,
    fontSize: 18,
    fontWeight: '900',
  },
  recommendationCard: {
    backgroundColor: '#FFF7DB',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 9,
    padding: 12,
  },
  recommendationLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
  },
  weeklyCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  weeklyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  weeklySubtitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  weeklyBars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    height: 92,
  },
  weeklyDay: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  weeklyBarTrack: {
    alignItems: 'center',
    backgroundColor: '#F4E6CC',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: 58,
    overflow: 'hidden',
    width: '100%',
  },
  weeklyBarFill: {
    backgroundColor: '#F5B83B',
    borderRadius: 999,
    width: '100%',
  },
  weeklyDayLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modeList: {
    gap: 8,
  },
  modeRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 12,
  },
  modeCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  modeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  modeSubtitle: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '800',
  },
  modeAccuracy: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  recentList: {
    gap: 8,
  },
  recentTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  recentRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  emptyStatsCard: {
    alignItems: 'center',
    backgroundColor: '#FFF9EC',
    borderColor: '#E8D6B8',
    borderRadius: 22,
    borderStyle: 'dashed',
    borderWidth: 2,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
  },
  emptySingra: {
    alignItems: 'center',
    backgroundColor: '#FFF0C8',
    borderRadius: 999,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  emptyCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  emptySubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  compactSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 14,
    ...softShadow,
  },
  compactTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 2,
  },
  compactList: {
    gap: 2,
  },
  compactRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 8,
  },
  compactLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  compactIcon: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    width: 24,
  },
  compactLabel: {
    color: colors.mutedText,
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  compactValue: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '900',
    maxWidth: '48%',
    textAlign: 'right',
  },
  actions: {
    gap: 10,
    paddingBottom: 4,
  },
});
