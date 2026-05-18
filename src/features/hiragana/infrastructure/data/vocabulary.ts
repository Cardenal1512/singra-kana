import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import { kanaExamples } from '@/src/features/hiragana/infrastructure/data/kanaExamples';
import { getVocabularyImage } from '@/src/shared/assets/imageRegistry';

export const hiraganaVocabulary: VocabularyItem[] = kanaExamples
  .map((example) => ({
    id: example.id,
    japanese: example.word,
    romaji: example.romaji,
    meaningEs: example.meaningEs,
    meaningEn: example.meaningEn,
    imageKey: example.imageKey,
    imageSource: getVocabularyImage(example.imageKey),
  }))
  .filter((item) => item.imageSource);
