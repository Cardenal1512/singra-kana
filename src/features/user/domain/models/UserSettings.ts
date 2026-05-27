export type UserThemePreference = 'system' | 'light' | 'dark';

export type UserSettings = {
  userId: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  romajiEnabled: boolean;
  showHints: boolean;
  leftHandedMode: boolean;
  aiFeedbackEnabled: boolean;
  theme: UserThemePreference;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserSettingsInput = Partial<
  Pick<
    UserSettings,
    | 'aiFeedbackEnabled'
    | 'hapticsEnabled'
    | 'leftHandedMode'
    | 'musicEnabled'
    | 'romajiEnabled'
    | 'showHints'
    | 'soundEnabled'
    | 'theme'
  >
>;
