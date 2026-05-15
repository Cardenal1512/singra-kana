import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';

type CheckRomajiAnswerResult = {
  isCorrect: boolean;
  expectedAnswers: string[];
};

export function checkRomajiAnswer(
  character: KanaCharacter,
  answer: string,
): CheckRomajiAnswerResult {
  const expectedAnswers = [character.romaji, ...(character.alternativeRomaji ?? [])];
  const normalizedAnswer = normalizeAnswer(answer);

  return {
    isCorrect: expectedAnswers.some((expectedAnswer) => {
      return normalizeAnswer(expectedAnswer) === normalizedAnswer;
    }),
    expectedAnswers,
  };
}

function normalizeAnswer(answer: string) {
  return answer.trim().replace(/\s+/g, ' ').toLowerCase();
}
