import type { AppUser } from '@/src/features/user/domain/models/AppUser';
import type { UserSettings } from '@/src/features/user/domain/models/UserSettings';

export type UserSession = {
  user: AppUser;
  settings: UserSettings;
  isFallback: boolean;
};
