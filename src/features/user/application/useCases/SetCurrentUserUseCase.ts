import type { LocalUserSessionStorage } from '@/src/features/user/domain/ports/LocalUserSessionStorage';

export class SetCurrentUserUseCase {
  constructor(private readonly localUserSessionStorage: LocalUserSessionStorage) {}

  execute(userId: string) {
    return this.localUserSessionStorage.setCurrentUserId(userId);
  }
}
