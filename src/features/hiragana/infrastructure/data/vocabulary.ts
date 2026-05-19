import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyImage } from '@/src/features/hiragana/domain/models/VocabularyImage';
import { kanaExamples } from '@/src/features/hiragana/infrastructure/data/kanaExamples';
import {
  kanaExampleToVocabularyImage,
  kanaExampleToVocabularyItem,
} from '@/src/features/hiragana/infrastructure/mappers/vocabularyMapper';

export const hiraganaVocabulary: VocabularyItem[] = kanaExamples
  .map(kanaExampleToVocabularyItem)
  .filter((item) => item.isActive);

export const hiraganaVocabularyImages: VocabularyImage[] = kanaExamples
  .map(kanaExampleToVocabularyImage)
  .filter((image): image is VocabularyImage => Boolean(image));
