import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AppUsageInput,
  AppUsageRecordResult,
} from '@/src/features/user/domain/models/AppUsage';
import type { AppUsageRepository } from '@/src/features/user/domain/repositories/AppUsageRepository';

type RecordAppUsageResponse = AppUsageRecordResult;

export class SupabaseAppUsageRepository implements AppUsageRepository {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async recordUsage(input: AppUsageInput): Promise<AppUsageRecordResult> {
    if (!this.client) {
      return { success: false, error: 'No se pudo conectar con el servidor' };
    }

    const { data, error } = await this.client.functions.invoke<RecordAppUsageResponse>(
      'record-app-usage',
      { body: input },
    );

    if (error) {
      console.warn('[app-usage] Failed to record usage', error);
      return { success: false, error: 'No se pudo guardar el tiempo de uso' };
    }

    return data ?? { success: false, error: 'No se pudo guardar el tiempo de uso' };
  }
}
