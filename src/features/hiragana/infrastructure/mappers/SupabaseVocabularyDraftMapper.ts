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
    status: row.status,
    source: row.source,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}
