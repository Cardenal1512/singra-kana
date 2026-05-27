import {
  createDefaultUserSession,
  defaultUserSettings,
} from '@/src/features/user/application/services/defaultUser';
import type { LocalUserSessionStorage } from '@/src/features/user/domain/ports/LocalUserSessionStorage';
import type { UserRepository } from '@/src/features/user/domain/repositories/UserRepository';
import type { UserSettingsRepository } from '@/src/features/user/domain/repositories/UserSettingsRepository';

export class GetCurrentUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSettingsRepository: UserSettingsRepository,
    private readonly localUserSessionStorage: LocalUserSessionStorage,
  ) {}

  async execute() {
    try {
      const localSession = await this.localUserSessionStorage.getCurrentSession();

      if (!localSession) {
        return undefined;
      }

      const user = await this.userRepository.findById(localSession.currentUserId);

      if (!user) {
        await this.localUserSessionStorage.clearCurrentSession();
        return undefined;
      }

      try {
        await this.userRepository.touchLastSeen(user.id);
      } catch {
        return createDefaultUserSession();
      }

      const settings = await this.userSettingsRepository.getByUserId(user.id);

      return {
        user,
        settings: settings ?? {
          ...defaultUserSettings,
          userId: user.id,
        },
        isFallback: false,
      };
    } catch (error) {
      console.warn('[USER_SESSION] Falling back to local Adri user', error);
      const localSession = await this.localUserSessionStorage.getCurrentSession();

      return localSession ? createDefaultUserSession() : undefined;
    }
  }
}
