export type VocabularyProgress = {
  id: string;
  userId?: string;
  vocabularyItemId: string;
  correctCount: number;
  incorrectCount: number;
  currentStreak: number;
  bestStreak: number;
  lastPracticedAt?: string;
  masteryLevel: number;
  nextReviewAt?: string;
  updatedAt: string;
};
