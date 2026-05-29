import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { RelaxedWritingCategory } from '@/src/features/hiragana/domain/models/RelaxedWritingCategory';

export type ManualWritingReview = 'correct' | 'doubtful' | 'incorrect';

export type WritingPracticeResult = {
  exampleImageKey?: string;
  exampleImageUrl?: string;
  feedbackCategory?: RelaxedWritingCategory;
  feedbackLabel?: string;
  kana: string;
  manualReview?: ManualWritingReview;
  romaji: string;
  skipped?: boolean;
  userStrokes: StrokePoint[][];
  score?: number;
};
