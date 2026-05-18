import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';

export type VocabularyAnswerResult = {
  isCorrect: boolean;
  normalizedAnswer: string;
};

export function checkVocabularyAnswer(
  item: VocabularyItem,
  answer: string,
): VocabularyAnswerResult {
  const japaneseAnswer = normalizeJapanese(answer);
  const expectedJapanese = normalizeJapanese(item.japanese);
  const romajiAnswer = normalizeRomaji(answer);
  const expectedRomaji = normalizeRomaji(item.romaji);

  return {
    isCorrect: japaneseAnswer === expectedJapanese || romajiAnswer === expectedRomaji,
    normalizedAnswer: romajiAnswer,
  };
}

function normalizeJapanese(value: string) {
  return value.trim();
}

function normalizeRomaji(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/gu, '');
}
