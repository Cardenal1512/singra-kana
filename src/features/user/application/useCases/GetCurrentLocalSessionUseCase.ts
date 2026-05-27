import type { LocalUserSessionStorage } from '@/src/features/user/domain/ports/LocalUserSessionStorage';

export class GetCurrentLocalSessionUseCase {
  constructor(private readonly localUserSessionStorage: LocalUserSessionStorage) {}

  execute() {
    return this.localUserSessionStorage.getCurrentSession();
  }
}
