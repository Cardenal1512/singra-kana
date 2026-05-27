import type { PinLoginInput, PinLoginResult } from '@/src/features/user/domain/models/PinLogin';

export interface PinAuthRepository {
  loginWithPin(input: PinLoginInput): Promise<PinLoginResult>;
}
