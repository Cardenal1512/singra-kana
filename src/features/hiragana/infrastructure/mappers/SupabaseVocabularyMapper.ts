import type { VocabularyImage } from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';

export type SupabaseVocabularyRow = {
  id: string;
  kana: string;
  japanese: string;
  romaji: string[];
  meaning_es: string | null;
  meaning_en: string | null;
  image_path: string | null;
  category: string | null;
  kana_series: string | null;
  source: 'official' | 'user' | null;
  approved: boolean | null;
  created_at: string | null;
};

export function mapSupabaseVocabularyRowToDomain(row: SupabaseVocabularyRow): VocabularyItem {
  const createdAt = row.created_at ?? new Date().toISOString();
  const image = mapSupabaseVocabularyImage(row, createdAt);

  return {
    id: row.id,
    kana: row.kana,
    kanaSystem: 'hiragana',
    japanese: row.japanese,
    readingKana: row.japanese,
    romaji: getPrimaryRomaji(row.romaji),
    meaningEs: row.meaning_es ?? undefined,
    meaningEn: row.meaning_en ?? undefined,
    category: row.category ?? undefined,
    kanaSeries: row.kana_series ?? undefined,
    tags: [row.category, row.kana_series].filter((tag): tag is string => Boolean(tag)),
    source: row.source ?? 'official',
    isActive: Boolean(row.approved),
    isOfficial: row.source !== 'user',
    approved: Boolean(row.approved),
    images: image ? [image] : [],
    createdAt,
    updatedAt: createdAt,
  };
}

function mapSupabaseVocabularyImage(
  row: SupabaseVocabularyRow,
  createdAt: string,
): VocabularyImage | undefined {
  if (!row.image_path) {
    return undefined;
  }

  return {
    id: `${row.id}-image`,
    vocabularyItemId: row.id,
    imageUrl: isUrl(row.image_path) ? row.image_path : undefined,
    imagePath: isUrl(row.image_path) ? undefined : row.image_path,
    sortOrder: 0,
    createdAt,
    updatedAt: createdAt,
  };
}

function isUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://');
}

function getPrimaryRomaji(romaji: string[]) {
  return romaji[0] ?? '';
}
