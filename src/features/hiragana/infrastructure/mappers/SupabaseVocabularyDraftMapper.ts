import type {
  CreateVocabularyDraftInput,
  VocabularyDraft,
} from '@/src/features/hiragana/domain/models/VocabularyDraft';
import type { VocabularyWritingSystem } from '@/src/features/hiragana/domain/models/WritingSystem';

export type SupabaseVocabularyDraftRow = {
  id: string;
  japanese: string;
  reading_kana: string;
  romaji: string[];
  meaning_es: string | null;
  meaning_en: string | null;
  main_kana: string;
  kana_series: string | null;
  writing_system: VocabularyWritingSystem;
  image_prompt: string | null;
  image_prompt_style_version: string | null;
  image_prompt_reference_bucket: string | null;
  image_prompt_reference_path: string | null;
  generated_image_path: string | null;
  image_generation_status: VocabularyDraft['imageGenerationStatus'] | null;
  image_generation_error: string | null;
  status: VocabularyDraft['status'];
  source: VocabularyDraft['source'];
  created_at: string | null;
  updated_at: string | null;
};

export function mapVocabularyDraftInputToSupabaseRow(input: CreateVocabularyDraftInput) {
  return {
    japanese: input.japanese,
    reading_kana: input.readingKana,
    romaji: input.romaji,
    meaning_es: input.meaningEs ?? null,
    meaning_en: input.meaningEn ?? null,
    main_kana: input.mainKana,
    kana_series: input.kanaSeries ?? null,
    writing_system: input.writingSystem,
    image_prompt: input.imagePrompt ?? null,
    image_prompt_style_version: input.imagePromptStyleVersion ?? null,
    image_prompt_reference_bucket: input.imagePromptReferenceBucket ?? null,
    image_prompt_reference_path: input.imagePromptReferencePath ?? null,
    status: 'draft' as const,
    source: 'manual' as const,
  };
}

export function mapSupabaseVocabularyDraftRowToDomain(
  row: SupabaseVocabularyDraftRow,
): VocabularyDraft {
  return {
    id: row.id,
    japanese: row.japanese,
    readingKana: row.reading_kana,
    romaji: row.romaji,
    meaningEs: row.meaning_es ?? undefined,
    meaningEn: row.meaning_en ?? undefined,
    mainKana: row.main_kana,
    kanaSeries: row.kana_series ?? undefined,
    writingSystem: row.writing_system,
    imagePrompt: row.image_prompt ?? undefined,
    imagePromptStyleVersion: row.image_prompt_style_version ?? undefined,
    imagePromptReferenceBucket: row.image_prompt_reference_bucket ?? undefined,
    imagePromptReferencePath: row.image_prompt_reference_path ?? undefined,
    generatedImagePath: row.generated_image_path ?? undefined,
    imageGenerationStatus: row.image_generation_status ?? undefined,
    imageGenerationError: row.image_generation_error ?? undefined,
    status: row.status,
    source: row.source,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}
