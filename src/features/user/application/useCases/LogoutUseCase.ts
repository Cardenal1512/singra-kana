import type { LocalUserSessionStorage } from '@/src/features/user/domain/ports/LocalUserSessionStorage';

export class LogoutUseCase {
  constructor(private readonly localUserSessionStorage: LocalUserSessionStorage) {}

  execute() {
    return this.localUserSessionStorage.clearCurrentSession();
  }
}
