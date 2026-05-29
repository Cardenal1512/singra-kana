import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  PracticeSessionInput,
  PracticeSessionRecordResult,
} from '@/src/features/hiragana/domain/models/PracticeSession';
import type { PracticeSessionRepository } from '@/src/features/hiragana/domain/repositories/PracticeSessionRepository';

type RecordPracticeSessionResponse = PracticeSessionRecordResult;

export class SupabasePracticeSessionRepository implements PracticeSessionRepository {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async recordSession(input: PracticeSessionInput): Promise<PracticeSessionRecordResult> {
    if (!this.client) {
      return { success: false, error: 'No se pudo conectar con el servidor' };
    }

    const { data, error } = await this.client.functions.invoke<RecordPracticeSessionResponse>(
      'record-practice-session',
      { body: input },
    );

    if (error) {
      console.warn('[practice-session] Failed to record session', error);
      return { success: false, error: 'No se pudo guardar la práctica' };
    }

    return data ?? { success: false, error: 'No se pudo guardar la práctica' };
  }
}
