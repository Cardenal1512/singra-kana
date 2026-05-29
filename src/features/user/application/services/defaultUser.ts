import type { AppUser } from '@/src/features/user/domain/models/AppUser';
import type { UserSettings } from '@/src/features/user/domain/models/UserSettings';

const now = '2026-01-01T00:00:00.000Z';

export const defaultUser: AppUser = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'adri',
  displayName: 'Adri',
  preferredLanguage: 'es',
  currentSyllabary: 'hiragana',
  currentLevel: 'beginner',
  dailyGoalMinutes: 10,
  dailyGoalLessons: 1,
  streakDays: 0,
  totalPracticeDays: 0,
  totalPracticeSessions: 0,
  totalPracticeTimeSeconds: 0,
  totalAppTimeSeconds: 0,
  createdAt: now,
  updatedAt: now,
};

export const defaultUserSettings: UserSettings = {
  userId: defaultUser.id,
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  romajiEnabled: true,
  showHints: true,
  leftHandedMode: false,
  aiFeedbackEnabled: true,
  theme: 'system',
  createdAt: now,
  updatedAt: now,
};

export function createDefaultUserSession() {
  return {
    user: defaultUser,
    settings: defaultUserSettings,
    isFallback: true,
  };
}
