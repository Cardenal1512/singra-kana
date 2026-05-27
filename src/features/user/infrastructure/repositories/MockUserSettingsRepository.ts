import { defaultUserSettings } from '@/src/features/user/application/services/defaultUser';
import type {
  UpdateUserSettingsInput,
  UserSettings,
} from '@/src/features/user/domain/models/UserSettings';
import type { UserSettingsRepository } from '@/src/features/user/domain/repositories/UserSettingsRepository';

export class MockUserSettingsRepository implements UserSettingsRepository {
  private settings: UserSettings;

  constructor(settings: UserSettings = defaultUserSettings) {
    this.settings = settings;
  }

  async getByUserId(userId: string) {
    return this.settings.userId === userId ? this.settings : undefined;
  }

  async update(userId: string, input: UpdateUserSettingsInput) {
    if (this.settings.userId !== userId) {
      throw new Error('User settings not found');
    }

    this.settings = {
      ...this.settings,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    return this.settings;
  }
}
