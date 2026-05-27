import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';
import { MockUserStatsRepository } from '@/src/features/user/infrastructure/repositories/MockUserStatsRepository';
import { SupabaseUserStatsRepository } from '@/src/features/user/infrastructure/repositories/SupabaseUserStatsRepository';

const provider = process.env.EXPO_PUBLIC_USER_PROVIDER ?? 'supabase';

export function createUserStatsRepository() {
  if (provider === 'mock' || !supabaseClient) {
    return new MockUserStatsRepository();
  }

  return new SupabaseUserStatsRepository(supabaseClient);
}
