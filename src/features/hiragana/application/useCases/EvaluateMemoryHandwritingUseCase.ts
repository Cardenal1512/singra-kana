import type {
  HandwritingEvaluationResult,
  HandwritingEvaluationSeriesSize,
} from '@/src/features/hiragana/domain/models/HandwritingEvaluation';
import type { MemoryHandwritingDrawing } from '@/src/features/hiragana/domain/models/MemoryHandwritingDrawing';
import type { HandwritingEvaluationPort } from '@/src/features/hiragana/domain/ports/HandwritingEvaluationPort';

type EvaluateMemoryHandwritingInput = {
  collageCanvasSize?: {
    height: number;
    width: number;
  };
  collageImageBase64?: string;
  collageImageMimeType?: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | 'image/svg+xml';
  collageImageUri?: string;
  collageStrokeWidth?: number;
  drawings: MemoryHandwritingDrawing[];
  seriesId?: string;
};

export class EvaluateMemoryHandwritingUseCase {
  constructor(private readonly handwritingEvaluationPort: HandwritingEvaluationPort) {}

  async execute({
    collageCanvasSize,
    collageImageBase64,
    collageImageMimeType,
    collageImageUri,
    collageStrokeWidth,
    drawings,
    seriesId,
  }: EvaluateMemoryHandwritingInput): Promise<HandwritingEvaluationResult | undefined> {
    const orderedDrawings = drawings
      .filter(Boolean)
      .sort((first, second) => first.order - second.order);
    const seriesSize = getSupportedSeriesSize(orderedDrawings.length);

    if (!seriesSize) {
      return undefined;
    }

    return this.handwritingEvaluationPort.evaluate({
      id: `memory-handwriting-${seriesId ?? 'series'}-${Date.now()}`,
      collageCanvasSize,
      collageImageBase64,
      collageImageMimeType,
      collageImageUri,
      collageStrokeWidth,
      seriesId,
      seriesSize,
      items: orderedDrawings.map((drawing) => ({
        id: drawing.id,
        kana: drawing.expectedKana,
        romaji: drawing.romaji,
      })),
    });
  }
}

function getSupportedSeriesSize(size: number): HandwritingEvaluationSeriesSize | undefined {
  if (size === 5 || size === 10 || size === 20) {
    return size;
  }

  return undefined;
}
