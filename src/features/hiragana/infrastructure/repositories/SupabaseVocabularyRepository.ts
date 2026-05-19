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

export class SupabaseVocabularyRepository implements VocabularyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getAll(): Promise<VocabularyItem[]> {
    const { data, error } = await this.client
      .from('vocabulary')
      .select(vocabularyColumns)
      .eq('approved', true)
      .returns<SupabaseVocabularyRow[]>();

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapSupabaseVocabularyRowToDomain);
  }
}
