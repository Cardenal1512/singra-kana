import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';

export function mapVocabularyItemToLocalDictionaryCandidate(
  item: VocabularyItem,
): DictionaryCandidate {
  return {
    id: `local-${item.id}`,
    origin: 'local',
    japanese: item.japanese,
    readingKana: item.readingKana ?? item.japanese,
    romaji: [item.romaji].filter(Boolean),
    meaningEs: item.meaningEs,
    meaningEn: item.meaningEn,
    suggestedWritingSystem: item.writingSystem,
  };
}
