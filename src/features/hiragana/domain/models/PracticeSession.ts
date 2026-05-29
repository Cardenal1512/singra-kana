export type PracticeSessionMode =
  | 'romaji-quiz'
  | 'vocabulary-image'
  | 'writing-trace'
  | 'writing-memory';

export type PracticeSessionAttemptTargetType = 'kana' | 'vocabulary';

export type PracticeSessionAttemptInput = {
  targetType: PracticeSessionAttemptTargetType;
  targetId: string;
  kana?: string;
  romaji?: string;
  expectedAnswer?: string;
  userAnswer?: string;
  isCorrect: boolean;
  score?: number;
  durationMs?: number;
  order?: number;
  metadata?: Record<string, unknown>;
  attemptedAt?: string;
};

export type PracticeSessionInput = {
  userId: string;
  practiceMode: PracticeSessionMode;
  syllabary?: string;
  seriesId?: string;
  seriesTitle?: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  totalAttempts?: number;
  correctAttempts?: number;
  wrongAttempts?: number;
  averageScore?: number;
  metadata?: Record<string, unknown>;
  attempts: PracticeSessionAttemptInput[];
};

export type PracticeSessionRecordResult = {
  success: boolean;
  sessionId?: string;
  error?: string;
};
