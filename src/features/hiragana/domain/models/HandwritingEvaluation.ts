export type EvaluationStatus = 'perfect' | 'good' | 'almost' | 'wrong';

export type EvaluationSeverity = 'minor' | 'medium' | 'major';

export type HandwritingEvaluationSource = 'ai' | 'mock' | 'fallback';

export type HandwritingEvaluationSeriesSize = 5 | 10 | 20;

export type HandwritingEvaluationRequestItem = {
  id: string;
  kana: string;
  romaji?: string;
  drawingImageUri?: string;
};

export type HandwritingEvaluationRequest = {
  id?: string;
  seriesId?: string;
  seriesSize: HandwritingEvaluationSeriesSize;
  items: HandwritingEvaluationRequestItem[];
  collageCanvasSize?: {
    height: number;
    width: number;
  };
  collageImageBase64?: string;
  collageImageMimeType?: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | 'image/svg+xml';
  collageImageUri?: string;
  collageStrokeWidth?: number;
};

export type EvaluationSummaryItem = {
  id: string;
  severity: EvaluationSeverity;
  message: string;
  kana?: string;
};

export type KanaEvaluationResult = {
  id: string;
  kana: string;
  romaji?: string;
  status: EvaluationStatus;
  score: number;
  confidence: number;
  feedback: string;
  summary: EvaluationSummaryItem[];
};

export type HandwritingEvaluationResult = {
  id: string;
  source: HandwritingEvaluationSource;
  status: EvaluationStatus;
  score: number;
  evaluatedAt: string;
  kanaResults: KanaEvaluationResult[];
  summary: EvaluationSummaryItem[];
};
