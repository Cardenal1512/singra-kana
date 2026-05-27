import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { HandwritingEvaluationSeriesSize } from '@/src/features/hiragana/domain/models/HandwritingEvaluation';

export type MemoryHandwritingCanvasSize = {
  width: number;
  height: number;
};

export type MemoryHandwritingDrawing = {
  id: string;
  order: number;
  expectedKana: string;
  romaji?: string;
  strokes: StrokePoint[][];
  canvasSize: MemoryHandwritingCanvasSize;
};

export type MemoryHandwritingDrawingSeries = {
  seriesId: string;
  seriesSize: HandwritingEvaluationSeriesSize;
  drawings: MemoryHandwritingDrawing[];
};
