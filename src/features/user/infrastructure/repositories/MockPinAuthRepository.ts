import { defaultUser } from '@/src/features/user/application/services/defaultUser';
import type { PinLoginInput, PinLoginResult } from '@/src/features/user/domain/models/PinLogin';
import type { PinAuthRepository } from '@/src/features/user/domain/repositories/PinAuthRepository';

export class MockPinAuthRepository implements PinAuthRepository {
  constructor(private readonly validPin = process.env.EXPO_PUBLIC_MOCK_USER_PIN ?? '1234') {}

  async loginWithPin(input: PinLoginInput): Promise<PinLoginResult> {
    if (input.username.toLowerCase() !== defaultUser.username || input.pin !== this.validPin) {
      return {
        success: false,
        error: 'PIN incorrecto',
      };
    }

    return {
      success: true,
      user: {
        id: defaultUser.id,
        username: defaultUser.username,
        displayName: defaultUser.displayName,
        preferredLanguage: defaultUser.preferredLanguage,
        currentSyllabary: defaultUser.currentSyllabary,
        currentLevel: defaultUser.currentLevel,
      },
    };
  }
}
