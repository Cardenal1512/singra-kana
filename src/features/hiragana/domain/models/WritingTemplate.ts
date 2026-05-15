import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';

export type WritingStrokeTemplate = {
  order: number;
  startPoint: StrokePoint;
  endPoint: StrokePoint;
  checkpoints: StrokePoint[];
};

export type WritingTemplate = {
  kana: string;
  romaji: string;
  strokes: WritingStrokeTemplate[];
};
