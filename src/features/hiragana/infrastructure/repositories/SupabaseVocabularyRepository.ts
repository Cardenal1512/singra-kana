import type { SupabaseClient } from '@supabase/supabase-js';

import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyRepository } from '@/src/features/hiragana/domain/repositories/VocabularyRepository';
import {
  mapSupabaseVocabularyRowToDomain,
  type SupabaseVocabularyRow,
} from '@/src/features/hiragana/infrastructure/mappers/SupabaseVocabularyMapper';

const vocabularyColumns = [
  'id',
  'kana',
  'japanese',
  'romaji',
  'meaning_es',
  'meaning_en',
  'image_path',
  'category',
  'kana_series',
  'source',
  'approved',
  'created_at',
].join(',');

type SupabaseVocabularyQuery = ReturnType<SupabaseClient['from']> & {
  eq(column: string, value: unknown): SupabaseVocabularyQuery;
  returns<T>(): Promise<{ data: T | null; error: Error | null }>;
};

export class SupabaseVocabularyRepository implements VocabularyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getAll(): Promise<VocabularyItem[]> {
    return this.queryApprovedVocabulary();
  }

  async getBySeries(seriesId: string): Promise<VocabularyItem[]> {
    if (seriesId === 'random') {
      return this.getAll();
    }

    return this.queryApprovedVocabulary((query) => query.eq('kana_series', seriesId));
  }

  async getByKana(kana: string): Promise<VocabularyItem[]> {
    return this.queryApprovedVocabulary((query) => query.eq('kana', kana));
  }

  private async queryApprovedVocabulary(
    refineQuery?: (query: SupabaseVocabularyQuery) => SupabaseVocabularyQuery,
  ): Promise<VocabularyItem[]> {
    const baseQuery = this.client
      .from('vocabulary')
      .select(vocabularyColumns)
      .eq('approved', true) as unknown as SupabaseVocabularyQuery;
    const query = refineQuery ? refineQuery(baseQuery) : baseQuery;
    const { data, error } = await query.returns<SupabaseVocabularyRow[]>();

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapSupabaseVocabularyRowToDomain);
  }
}
