import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { RelaxedWritingCategory } from '@/src/features/hiragana/domain/models/RelaxedWritingCategory';

export type WritingPracticeResult = {
  exampleImageKey?: string;
  exampleImageUrl?: string;
  feedbackCategory?: RelaxedWritingCategory;
  feedbackLabel?: string;
  kana: string;
  romaji: string;
  userStrokes: StrokePoint[][];
  score?: number;
};
