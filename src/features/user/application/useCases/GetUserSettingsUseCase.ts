import { defaultUserSettings } from '@/src/features/user/application/services/defaultUser';
import type { UserSettingsRepository } from '@/src/features/user/domain/repositories/UserSettingsRepository';

export class GetUserSettingsUseCase {
  constructor(private readonly userSettingsRepository: UserSettingsRepository) {}

  async execute(userId: string) {
    return this.userSettingsRepository.getByUserId(userId)
      ?? {
        ...defaultUserSettings,
        userId,
      };
  }
}
