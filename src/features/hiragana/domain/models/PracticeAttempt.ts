export type PracticeTargetType = 'vocabulary' | 'kana';

export type PracticeModeId =
  | 'vocabulary-image'
  | 'romaji-quiz'
  | 'writing'
  | 'listening'
  | 'flashcard';

export type PracticeAttempt = {
  id: string;
  userId?: string;
  targetType: PracticeTargetType;
  targetId: string;
  practiceMode: PracticeModeId;
  answer: string;
  expectedAnswer: string;
  isCorrect: boolean;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  attemptedAt: string;
};
