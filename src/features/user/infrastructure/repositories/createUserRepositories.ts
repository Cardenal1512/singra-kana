import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';
import { FallbackUserRepository } from '@/src/features/user/infrastructure/repositories/FallbackUserRepository';
import { FallbackUserSettingsRepository } from '@/src/features/user/infrastructure/repositories/FallbackUserSettingsRepository';
import { MockUserRepository } from '@/src/features/user/infrastructure/repositories/MockUserRepository';
import { MockUserSettingsRepository } from '@/src/features/user/infrastructure/repositories/MockUserSettingsRepository';
import { SupabaseUserRepository } from '@/src/features/user/infrastructure/repositories/SupabaseUserRepository';
import { SupabaseUserSettingsRepository } from '@/src/features/user/infrastructure/repositories/SupabaseUserSettingsRepository';

const provider = process.env.EXPO_PUBLIC_USER_PROVIDER ?? 'supabase';

export function createUserRepository() {
  const mockRepository = new MockUserRepository();

  if (provider === 'mock' || !supabaseClient) {
    return mockRepository;
  }

  return new FallbackUserRepository(
    new SupabaseUserRepository(supabaseClient),
    mockRepository,
  );
}

export function createUserSettingsRepository() {
  const mockRepository = new MockUserSettingsRepository();

  if (provider === 'mock' || !supabaseClient) {
    return mockRepository;
  }

  return new FallbackUserSettingsRepository(
    new SupabaseUserSettingsRepository(supabaseClient),
    mockRepository,
  );
}
