import type { SupabaseClient } from '@supabase/supabase-js';

import type { PinLoginInput, PinLoginResult } from '@/src/features/user/domain/models/PinLogin';
import type { PinAuthRepository } from '@/src/features/user/domain/repositories/PinAuthRepository';

type LoginWithPinResponse = PinLoginResult;

export class SupabasePinAuthRepository implements PinAuthRepository {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async loginWithPin(input: PinLoginInput): Promise<PinLoginResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'No se pudo conectar con el servidor',
      };
    }

    const { data, error } = await this.client.functions.invoke<LoginWithPinResponse>(
      'login-with-pin',
      {
        body: input,
      },
    );

    if (error) {
      return {
        success: false,
        error: 'No se pudo validar el PIN',
      };
    }

    return data ?? {
      success: false,
      error: 'No se pudo validar el PIN',
    };
  }
}
