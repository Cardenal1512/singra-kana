import type { SupabaseClient } from '@supabase/supabase-js';

import type { VocabularyDraft } from '@/src/features/hiragana/domain/models/VocabularyDraft';
import type {
  GenerateVocabularyImageInput,
  ImageGenerationRepository,
} from '@/src/features/hiragana/domain/repositories/ImageGenerationRepository';
import {
  mapSupabaseVocabularyDraftRowToDomain,
  type SupabaseVocabularyDraftRow,
} from '@/src/features/hiragana/infrastructure/mappers/SupabaseVocabularyDraftMapper';
import { supabaseConfig } from '@/src/infrastructure/supabase/supabaseClient';

export class SupabaseImageGenerationRepository implements ImageGenerationRepository {
  constructor(private readonly client: SupabaseClient | undefined) {}

  async generateVocabularyImage(input: GenerateVocabularyImageInput): Promise<VocabularyDraft> {
    if (!this.client) {
      throw new Error('Supabase is not configured for image generation');
    }

    const data = await invokeGenerateVocabularyImage(input);

    return mapSupabaseVocabularyDraftRowToDomain(data);
  }
}

async function invokeGenerateVocabularyImage(
  input: GenerateVocabularyImageInput,
): Promise<SupabaseVocabularyDraftRow> {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  const response = await fetch(`${supabaseConfig.url}/functions/v1/generate-vocabulary-image`, {
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${supabaseConfig.publishableKey}`,
      'Content-Type': 'application/json',
      apikey: supabaseConfig.publishableKey,
    },
    method: 'POST',
  });
  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(`Image generation failed: ${formatPayloadError(payload)}`);
  }

  return payload as SupabaseVocabularyDraftRow;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatPayloadError(payload: unknown) {
  if (!payload) {
    return 'empty error response';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload === 'object' && payload !== null) {
    const maybePayload = payload as { error?: unknown; image_generation_error?: unknown };
    return String(maybePayload.error ?? maybePayload.image_generation_error ?? JSON.stringify(payload));
  }

  return String(payload);
}
