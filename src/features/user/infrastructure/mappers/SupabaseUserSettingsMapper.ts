import type {
  UpdateUserSettingsInput,
  UserSettings,
  UserThemePreference,
} from '@/src/features/user/domain/models/UserSettings';

export type SupabaseUserSettingsRow = {
  user_id: string;
  sound_enabled: boolean;
  music_enabled: boolean;
  haptics_enabled: boolean;
  romaji_enabled: boolean;
  show_hints: boolean;
  left_handed_mode: boolean;
  ai_feedback_enabled: boolean;
  theme: string;
  created_at: string;
  updated_at: string;
};

export type SupabaseUserSettingsUpdateRow = Partial<{
  ai_feedback_enabled: boolean;
  haptics_enabled: boolean;
  left_handed_mode: boolean;
  music_enabled: boolean;
  romaji_enabled: boolean;
  show_hints: boolean;
  sound_enabled: boolean;
  theme: UserThemePreference;
  updated_at: string;
}>;

export function mapSupabaseUserSettingsRowToDomain(row: SupabaseUserSettingsRow): UserSettings {
  return {
    userId: row.user_id,
    soundEnabled: row.sound_enabled,
    musicEnabled: row.music_enabled,
    hapticsEnabled: row.haptics_enabled,
    romajiEnabled: row.romaji_enabled,
    showHints: row.show_hints,
    leftHandedMode: row.left_handed_mode,
    aiFeedbackEnabled: row.ai_feedback_enabled,
    theme: normalizeTheme(row.theme),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUpdateUserSettingsInputToSupabaseRow(
  input: UpdateUserSettingsInput,
): SupabaseUserSettingsUpdateRow {
  return {
    ai_feedback_enabled: input.aiFeedbackEnabled,
    haptics_enabled: input.hapticsEnabled,
    left_handed_mode: input.leftHandedMode,
    music_enabled: input.musicEnabled,
    romaji_enabled: input.romajiEnabled,
    show_hints: input.showHints,
    sound_enabled: input.soundEnabled,
    theme: input.theme,
    updated_at: new Date().toISOString(),
  };
}

function normalizeTheme(value: string): UserThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}
