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
  'image_prompt',
  'image_prompt_style_version',
  'image_prompt_reference_bucket',
  'image_prompt_reference_path',
  'generated_image_path',
  'image_generation_status',
  'image_generation_error',
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
      throw new Error(formatSupabaseError(error));
    }

    if (!data) {
      throw new Error('Vocabulary draft was not created');
    }

    return mapSupabaseVocabularyDraftRowToDomain(data);
  }
}

function formatSupabaseError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const parts = [
      maybeError.message ? `message: ${String(maybeError.message)}` : undefined,
      maybeError.code ? `code: ${String(maybeError.code)}` : undefined,
      maybeError.details ? `details: ${String(maybeError.details)}` : undefined,
      maybeError.hint ? `hint: ${String(maybeError.hint)}` : undefined,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(' | ');
    }

    return JSON.stringify(error);
  }

  return String(error);
}
