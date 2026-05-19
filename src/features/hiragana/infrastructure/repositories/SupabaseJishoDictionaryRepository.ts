import type { SupabaseClient } from '@supabase/supabase-js';

import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type { DictionaryRepository } from '@/src/features/hiragana/domain/repositories/DictionaryRepository';
import {
  mapJishoEntriesToDictionaryCandidates,
  type JishoResponse,
} from '@/src/features/hiragana/infrastructure/mappers/JishoDictionaryMapper';

export class SupabaseJishoDictionaryRepository implements Pick<DictionaryRepository, 'searchExternal'> {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async searchExternal(query: string): Promise<DictionaryCandidate[]> {
    if (!this.client) {
      throw new Error('Supabase is not configured for Jisho proxy search');
    }

    const { data, error } = await this.client.functions.invoke<JishoResponse>('jisho-search', {
      body: { query },
    });

    if (error) {
      throw new Error(`Supabase Jisho proxy failed for "${query}": ${error.message}`);
    }

    if (!data) {
      throw new Error(`Supabase Jisho proxy returned no data for "${query}"`);
    }

    if (data.meta.status !== 200) {
      throw new Error(`Jisho proxy payload status was ${data.meta.status} for "${query}"`);
    }

    return mapJishoEntriesToDictionaryCandidates(data.data, query);
  }
}
