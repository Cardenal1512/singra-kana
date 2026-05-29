import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';
import { MockAppUsageRepository } from '@/src/features/user/infrastructure/repositories/MockAppUsageRepository';
import { SupabaseAppUsageRepository } from '@/src/features/user/infrastructure/repositories/SupabaseAppUsageRepository';

const provider = process.env.EXPO_PUBLIC_USER_PROVIDER ?? 'supabase';

export function createAppUsageRepository() {
  if (provider === 'mock' || !supabaseClient) {
    return new MockAppUsageRepository();
  }

  return new SupabaseAppUsageRepository(supabaseClient);
}
