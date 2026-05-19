import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { KanaSyllabary } from '@/src/features/hiragana/domain/models/WritingSystem';

export type SupabaseKanaSeriesRow = {
  id: string;
  syllabary: KanaSyllabary;
  title: string;
  subtitle: string | null;
  representative_kana: string;
  display_order: number;
  enabled: boolean;
};

export type SupabaseKanaCharacterRow = {
  id: string;
  series_id: string;
  syllabary: KanaSyllabary;
  kana: string;
  romaji: string;
  romaji_aliases: string[] | null;
  display_order: number;
  enabled: boolean;
};

export function mapSupabaseKanaSeriesToDomain(
  row: SupabaseKanaSeriesRow,
  characters: KanaCharacter[],
): KanaSeries {
  return {
    id: row.id,
    syllabary: row.syllabary,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    representativeKana: row.representative_kana,
    characters,
  };
}

export function mapSupabaseKanaCharacterToDomain(row: SupabaseKanaCharacterRow): KanaCharacter {
  return {
    id: row.id,
    syllabary: row.syllabary,
    kana: row.kana,
    romaji: row.romaji,
    alternativeRomaji: row.romaji_aliases ?? undefined,
    group: row.series_id,
  };
}
