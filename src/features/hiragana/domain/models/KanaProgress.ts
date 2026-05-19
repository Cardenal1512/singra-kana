export type KanaProgress = {
  id: string;
  userId?: string;
  kanaId: string;
  correctCount: number;
  incorrectCount: number;
  writingCorrectCount: number;
  writingIncorrectCount: number;
  currentStreak: number;
  bestStreak: number;
  masteryLevel: number;
  lastPracticedAt?: string;
  nextReviewAt?: string;
  updatedAt: string;
};
