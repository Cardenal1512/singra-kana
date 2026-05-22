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
  'category',
  'approved_image_path',
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

    const imagePath = await this.uploadManualImage(input);

    const { data, error } = await (this.client
      .from('vocabulary_draft')
      .insert(mapVocabularyDraftInputToSupabaseRow({
        ...input,
        manualImage: {
          ...input.manualImage,
          fileName: imagePath,
        },
      }))
      .select(vocabularyDraftColumns) as unknown as SupabaseVocabularyDraftInsertQuery).single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    if (!data) {
      throw new Error('Vocabulary draft was not created');
    }

    return mapSupabaseVocabularyDraftRowToDomain(data);
  }

  private async uploadManualImage(input: CreateVocabularyDraftInput) {
    if (!this.client) {
      throw new Error('Supabase is not configured');
    }

    const response = await fetch(input.manualImage.uri);
    const imageBlob = await response.blob();
    const imagePath = createManualVocabularyImagePath(input);
    const { error } = await this.client.storage
      .from('vocabulary')
      .upload(imagePath, imageBlob, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (error) {
      throw new Error(`No se pudo subir la imagen a Supabase Storage: ${formatSupabaseError(error)}`);
    }

    return imagePath;
  }
}

function createManualVocabularyImagePath(input: CreateVocabularyDraftInput) {
  const safeJapanese = input.japanese
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/giu, '-')
    .replace(/^-+|-+$/gu, '');
  const baseName = safeJapanese || 'vocabulary';

  return `manual/${baseName}-${Date.now()}.webp`;
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
