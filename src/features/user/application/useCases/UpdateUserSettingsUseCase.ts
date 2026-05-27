import type { UpdateUserSettingsInput } from '@/src/features/user/domain/models/UserSettings';
import type { UserSettingsRepository } from '@/src/features/user/domain/repositories/UserSettingsRepository';

export class UpdateUserSettingsUseCase {
  constructor(private readonly userSettingsRepository: UserSettingsRepository) {}

  execute(userId: string, input: UpdateUserSettingsInput) {
    return this.userSettingsRepository.update(userId, input);
  }
}
