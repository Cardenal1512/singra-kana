import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';
import { MockPinAuthRepository } from '@/src/features/user/infrastructure/repositories/MockPinAuthRepository';
import { SupabasePinAuthRepository } from '@/src/features/user/infrastructure/repositories/SupabasePinAuthRepository';

const provider = process.env.EXPO_PUBLIC_USER_PROVIDER ?? 'supabase';

export function createPinAuthRepository() {
  if (provider === 'mock') {
    return new MockPinAuthRepository();
  }

  if (!supabaseClient) {
    return new MockPinAuthRepository();
  }

  return new SupabasePinAuthRepository(supabaseClient);
}
