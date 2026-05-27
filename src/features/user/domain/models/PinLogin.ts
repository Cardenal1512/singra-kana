import type { AppUser } from '@/src/features/user/domain/models/AppUser';

export type PinLoginInput = {
  username: string;
  pin: string;
};

export type PinLoginResult =
  | {
      success: true;
      user: Pick<AppUser, 'currentLevel' | 'currentSyllabary' | 'displayName' | 'id' | 'preferredLanguage' | 'username'>;
    }
  | {
      success: false;
      error: string;
    };
