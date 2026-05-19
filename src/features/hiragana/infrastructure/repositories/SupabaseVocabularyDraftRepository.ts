import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateVocabularyDraftInput,
  VocabularyDraft,
} from '@/src/features/hiragana/domain/models/VocabularyDraft';
import type { VocabularyDraftRepository } from '@/src/features/hiragana/domain/repositories/VocabularyDraftRepository';
import {
  mapSupabaseVocabularyDraftRowToDomain,
  mapVocabularyDraftInputToSupabaseRow,
  type SupabaseVocabularyDraftRow,
} from '@/src/features/hiragana/infrastructure/mappers/SupabaseVocabularyDraftMapper';

type SupabaseVocabularyDraftInsertQuery = ReturnType<SupabaseClient['from']> & {
  insert(value: ReturnType<typeof mapVocabularyDraftInputToSupabaseRow>): SupabaseVocabularyDraftInsertQuery;
  select(columns: string): SupabaseVocabularyDraftInsertQuery;
  single(): Promise<{ data: SupabaseVocabularyDraftRow | null; error: Error | null }>;
};

const vocabularyDraftColumns = [
  'id',
  'japanese',
  'reading_kana',
  'romaji',
  'meaning_es',
  'meaning_en',
  'main_kana',
  'kana_series',
  'writing_system',
  'status',
  'source',
  'created_at',
  'updated_at',
].join(',');

export class SupabaseVocabularyDraftRepository implements VocabularyDraftRepository {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async create(input: CreateVocabularyDraftInput): Promise<VocabularyDraft> {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await (this.client
      .from('vocabulary_draft')
      .insert(mapVocabularyDraftInputToSupabaseRow(input))
      .select(vocabularyDraftColumns) as unknown as SupabaseVocabularyDraftInsertQuery).single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Vocabulary draft was not created');
    }

    return mapSupabaseVocabularyDraftRowToDomain(data);
  }
}
