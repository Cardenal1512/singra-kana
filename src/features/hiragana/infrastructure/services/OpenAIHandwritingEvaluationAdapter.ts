import type {
  EvaluationSeverity,
  EvaluationStatus,
  HandwritingEvaluationRequest,
  HandwritingEvaluationResult,
  KanaEvaluationResult,
} from '@/src/features/hiragana/domain/models/HandwritingEvaluation';
import type { HandwritingEvaluationPort } from '@/src/features/hiragana/domain/ports/HandwritingEvaluationPort';
import type { SupabaseClient } from '@supabase/supabase-js';

type OpenAIHandwritingEvaluationAdapterOptions = {
  client: SupabaseClient;
};

type HandwritingEvaluationApiResponse = {
  results: OpenAIKanaEvaluationItem[];
  summary: OpenAISummaryItem[];
};

type OpenAIKanaEvaluationItem = {
  expectedKana: string;
  detectedKana: string | null;
  status: EvaluationStatus;
  severity: EvaluationSeverity;
  confidence: number;
  confusedWith: string | null;
};

type OpenAISummaryItem = {
  kana: string;
  message: string;
};

const functionName = 'evaluate-handwriting';

export class OpenAIHandwritingEvaluationAdapter implements HandwritingEvaluationPort {
  private readonly client: SupabaseClient;

  constructor({ client }: OpenAIHandwritingEvaluationAdapterOptions) {
    this.client = client;
  }

  async evaluate(request: HandwritingEvaluationRequest): Promise<HandwritingEvaluationResult> {
    try {
      const imageBase64 = await resolveImageBase64(request);

      if (!imageBase64) {
        throw new Error('Handwriting evaluation requires a collage image');
      }

      const expectedKanaOrder = request.items.map((item) => item.kana);
      const collageBase64 = imageBase64;
      const layout = getEvaluationLayout(request.seriesSize);

      console.log('[AI_EVALUATION] invoking function', {
        functionName,
        hasCollage: Boolean(collageBase64),
        kanaCount: expectedKanaOrder.length,
        layout,
        payloadSize: collageBase64.length,
      });

      const { data, error } = await this.client.functions.invoke<HandwritingEvaluationApiResponse>(
        functionName,
        {
          body: {
            collageBase64,
            expectedKanaOrder,
            imageMimeType: request.collageImageMimeType ?? 'image/png',
            layout,
            metadata: {
              canvasSize: request.collageCanvasSize,
              kanaCount: expectedKanaOrder.length,
              strokeWidth: request.collageStrokeWidth,
            },
            order: 'left-to-right top-to-bottom',
          },
        },
      );

      console.log('[AI_EVALUATION] response', {
        functionName,
        resultCount: data?.results.length,
        summaryCount: data?.summary.length,
      });

      if (error) {
        const details = await getFunctionErrorDetails(error);
        console.error('[AI_EVALUATION] error', {
          functionName,
          message: getErrorMessage(error),
          status: details?.status,
        });
        console.error('[AI_EVALUATION] edge function error details', details);
        throw error;
      }

      if (!data) {
        throw new Error('evaluate-handwriting returned an empty response');
      }

      return mapApiResponseToDomain(request, data);
    } catch (error) {
      console.error('[AI_EVALUATION] error', {
        functionName,
        message: getErrorMessage(error),
      });
      console.error('[AI_EVALUATION] Failed, using fallback', {
        functionName,
        message: getErrorMessage(error),
      });
      return buildFallbackEvaluation(request);
    }
  }
}

function getEvaluationLayout(seriesSize: HandwritingEvaluationRequest['seriesSize']) {
  if (seriesSize === 5) {
    return '1x5';
  }

  if (seriesSize === 10) {
    return '2x5';
  }

  return '4x5';
}

async function getFunctionErrorDetails(error: unknown) {
  if (!isRecord(error) || !isResponseLike(error.context)) {
    return undefined;
  }

  const body = await readResponseBody(error.context);

  return {
    body,
    status: error.context.status,
    statusText: error.context.statusText,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function readResponseBody(response: Response) {
  try {
    return await response.clone().json();
  } catch {
    try {
      return await response.clone().text();
    } catch {
      return undefined;
    }
  }
}

function isResponseLike(value: unknown): value is Response {
  return isRecord(value) && typeof value.status === 'number' && typeof value.clone === 'function';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function resolveImageBase64(request: HandwritingEvaluationRequest) {
  if (request.collageImageBase64) {
    return request.collageImageBase64;
  }

  return undefined;
}

function mapApiResponseToDomain(
  request: HandwritingEvaluationRequest,
  payload: HandwritingEvaluationApiResponse,
): HandwritingEvaluationResult {
  const kanaResults = request.items.map<KanaEvaluationResult>((item, index) => {
    const result = payload.results[index];
    const status = result?.status ?? 'wrong';
    const feedback = result?.confusedWith
      ? `Looks closer to ${result.confusedWith}.`
      : getFeedbackFromStatus(status);

    return {
      id: item.id,
      kana: item.kana,
      romaji: item.romaji,
      status,
      score: getScoreFromStatus(status, result?.confidence),
      confidence: result?.confidence ?? 0.5,
      feedback,
      summary:
        result?.severity === 'major'
          ? [
              {
                id: `${item.id}-ai-summary`,
                kana: item.kana,
                message: feedback.slice(0, 80),
                severity: 'major',
              },
            ]
          : [],
    };
  });
  const summary = payload.summary.slice(0, 3).map((item, index) => ({
    id: `${request.id ?? 'ai'}-summary-${index}`,
    kana: item.kana,
    message: item.message.slice(0, 80),
    severity: 'major' as const,
  }));

  return {
    id: request.id ?? `openai-handwriting-evaluation-${Date.now()}`,
    source: 'ai',
    status: getOverallStatus(kanaResults),
    score: Math.round(kanaResults.reduce((sum, item) => sum + item.score, 0) / kanaResults.length),
    evaluatedAt: new Date().toISOString(),
    kanaResults,
    summary,
  };
}

function buildFallbackEvaluation(request: HandwritingEvaluationRequest): HandwritingEvaluationResult {
  const kanaResults = request.items.map<KanaEvaluationResult>((item) => ({
    id: item.id,
    kana: item.kana,
    romaji: item.romaji,
    status: 'wrong',
    score: 1,
    confidence: 0.01,
    feedback: 'AI evaluation failed, fallback used',
    summary: [
      {
        id: `${item.id}-fallback-summary`,
        kana: item.kana,
        message: 'AI evaluation failed, fallback used',
        severity: 'major',
      },
    ],
  }));

  return {
    id: request.id ?? `fallback-handwriting-evaluation-${Date.now()}`,
    source: 'fallback',
    status: 'wrong',
    score: 1,
    evaluatedAt: new Date().toISOString(),
    kanaResults,
    summary: kanaResults.flatMap((result) => result.summary),
  };
}

function getFeedbackFromStatus(status: EvaluationStatus) {
  if (status === 'perfect') {
    return 'Clear and recognizable.';
  }

  if (status === 'good') {
    return 'Recognizable kana.';
  }

  if (status === 'almost') {
    return 'Close, but confusing.';
  }

  return 'Hard to recognize.';
}

function getScoreFromStatus(status: EvaluationStatus, confidence = 0.5) {
  const baseScore: Record<EvaluationStatus, number> = {
    perfect: 96,
    good: 82,
    almost: 58,
    wrong: 22,
  };

  return Math.round(baseScore[status] * Math.max(0.4, Math.min(1, confidence)));
}

function getOverallStatus(results: KanaEvaluationResult[]): EvaluationStatus {
  if (results.some((result) => result.status === 'wrong')) {
    return 'wrong';
  }

  if (results.some((result) => result.status === 'almost')) {
    return 'almost';
  }

  if (results.some((result) => result.status === 'good')) {
    return 'good';
  }

  return 'perfect';
}
