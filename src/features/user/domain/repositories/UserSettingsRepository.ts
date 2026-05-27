import type {
  UpdateUserSettingsInput,
  UserSettings,
} from '@/src/features/user/domain/models/UserSettings';

export interface UserSettingsRepository {
  getByUserId(userId: string): Promise<UserSettings | undefined>;
  update(userId: string, input: UpdateUserSettingsInput): Promise<UserSettings>;
}
