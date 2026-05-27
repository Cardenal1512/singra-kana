import type { SupabaseClient } from '@supabase/supabase-js';

import type { UserStatsRepository } from '@/src/features/user/domain/repositories/UserStatsRepository';

export class SupabaseUserStatsRepository implements UserStatsRepository {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async getSummaryByUserId() {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    return {
      practicedKanaCount: 0,
      masteredKanaCount: 0,
      weakestKana: [],
    };
  }
}
