import type {
  UpdateUserSettingsInput,
  UserSettings,
} from '@/src/features/user/domain/models/UserSettings';
import type { UserSettingsRepository } from '@/src/features/user/domain/repositories/UserSettingsRepository';

export class FallbackUserSettingsRepository implements UserSettingsRepository {
  constructor(
    private readonly primaryRepository: UserSettingsRepository,
    private readonly fallbackRepository: UserSettingsRepository,
  ) {}

  async getByUserId(userId: string): Promise<UserSettings | undefined> {
    try {
      return await this.primaryRepository.getByUserId(userId);
    } catch {
      return this.fallbackRepository.getByUserId(userId);
    }
  }

  async update(userId: string, input: UpdateUserSettingsInput): Promise<UserSettings> {
    try {
      return await this.primaryRepository.update(userId, input);
    } catch {
      return this.fallbackRepository.update(userId, input);
    }
  }
}
