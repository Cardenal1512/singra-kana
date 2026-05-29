import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';
import { MockPracticeSessionRepository } from '@/src/features/hiragana/infrastructure/repositories/MockPracticeSessionRepository';
import { SupabasePracticeSessionRepository } from '@/src/features/hiragana/infrastructure/repositories/SupabasePracticeSessionRepository';

const provider = process.env.EXPO_PUBLIC_USER_PROVIDER ?? 'supabase';

export function createPracticeSessionRepository() {
  if (provider === 'mock' || !supabaseClient) {
    return new MockPracticeSessionRepository();
  }

  return new SupabasePracticeSessionRepository(supabaseClient);
}
