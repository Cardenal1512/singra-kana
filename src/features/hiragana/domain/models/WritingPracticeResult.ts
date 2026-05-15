import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';

export type WritingPracticeResult = {
  kana: string;
  romaji: string;
  userStrokes: StrokePoint[][];
  score?: number;
};
