import type { KanaExample } from '@/src/features/hiragana/domain/models/KanaExample';
import type { VocabularyImage } from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';

const localSeedTimestamp = '2026-05-19T00:00:00.000Z';

export function kanaExampleToVocabularyItem(example: KanaExample): VocabularyItem {
  const image = kanaExampleToVocabularyImage(example);

  return {
    id: example.id,
    kana: example.kana,
    kanaSystem: 'hiragana',
    japanese: example.word,
    readingKana: example.word,
    romaji: example.romaji,
    meaningEs: example.meaningEs,
    meaningEn: example.meaningEn,
    category: 'hiragana',
    kanaSeries: example.kana,
    tags: [example.kana],
    source: example.source,
    isActive: true,
    isOfficial: example.source === 'official',
    approved: true,
    images: image ? [image] : [],
    createdAt: localSeedTimestamp,
    updatedAt: localSeedTimestamp,
  };
}

export function kanaExampleToVocabularyImage(example: KanaExample): VocabularyImage | undefined {
  if (!example.imageKey) {
    return undefined;
  }

  return {
    id: `${example.id}-image`,
    vocabularyItemId: example.id,
    imagePath: `${example.imageKey}.webp`,
    localAssetKey: example.imageKey,
    altTextEs: example.meaningEs,
    altTextEn: example.meaningEn,
    sortOrder: 0,
    createdAt: localSeedTimestamp,
    updatedAt: localSeedTimestamp,
  };
}
