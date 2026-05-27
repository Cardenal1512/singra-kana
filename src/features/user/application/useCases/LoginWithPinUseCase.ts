import type { PinLoginInput } from '@/src/features/user/domain/models/PinLogin';
import type { LocalUserSessionStorage } from '@/src/features/user/domain/ports/LocalUserSessionStorage';
import type { PinAuthRepository } from '@/src/features/user/domain/repositories/PinAuthRepository';

export class LoginWithPinUseCase {
  constructor(
    private readonly pinAuthRepository: PinAuthRepository,
    private readonly localUserSessionStorage: LocalUserSessionStorage,
  ) {}

  async execute(input: PinLoginInput) {
    const result = await this.pinAuthRepository.loginWithPin(input);

    if (!result.success) {
      return result;
    }

    await this.localUserSessionStorage.setCurrentSession({
      currentUserId: result.user.id,
      username: result.user.username,
      displayName: result.user.displayName,
    });

    return result;
  }
}
