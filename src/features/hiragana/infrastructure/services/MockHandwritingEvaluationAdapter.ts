import type {
  EvaluationStatus,
  EvaluationSummaryItem,
  HandwritingEvaluationRequest,
  HandwritingEvaluationResult,
  KanaEvaluationResult,
} from '@/src/features/hiragana/domain/models/HandwritingEvaluation';
import type { HandwritingEvaluationPort } from '@/src/features/hiragana/domain/ports/HandwritingEvaluationPort';

type MockHandwritingEvaluationAdapterOptions = {
  evaluatedAt?: string;
  statuses?: EvaluationStatus[];
};

const defaultStatuses: EvaluationStatus[] = ['perfect', 'good', 'almost', 'wrong'];

const scoreByStatus: Record<EvaluationStatus, number> = {
  perfect: 98,
  good: 82,
  almost: 61,
  wrong: 24,
};

const feedbackByStatus: Record<EvaluationStatus, string> = {
  perfect: 'MOCK RESULT - this did not call AI',
  good: 'MOCK RESULT - this did not call AI',
  almost: 'MOCK RESULT - this did not call AI',
  wrong: 'MOCK RESULT - this did not call AI',
};

export class MockHandwritingEvaluationAdapter implements HandwritingEvaluationPort {
  private readonly evaluatedAt?: string;
  private readonly statuses: EvaluationStatus[];

  constructor(options: MockHandwritingEvaluationAdapterOptions = {}) {
    this.evaluatedAt = options.evaluatedAt;
    this.statuses = options.statuses?.length ? options.statuses : defaultStatuses;
  }

  async evaluate(request: HandwritingEvaluationRequest): Promise<HandwritingEvaluationResult> {
    console.log('[MOCK_EVALUATION] Mock evaluator called');

    const kanaResults = request.items.map<KanaEvaluationResult>((item) => {
      const status = 'wrong';
      const summary: EvaluationSummaryItem[] = [
        {
          id: `${item.id}-mock-summary`,
          kana: item.kana,
          message: feedbackByStatus[status],
          severity: 'major',
        },
      ];

      return {
        id: item.id,
        kana: item.kana,
        romaji: item.romaji,
        status,
        score: scoreByStatus[status],
        confidence: 0.01,
        feedback: feedbackByStatus[status],
        summary,
      };
    });

    const score = getAverageScore(kanaResults);

    return {
      id: request.id ?? `mock-handwriting-evaluation-${Date.now()}`,
      source: 'mock',
      status: getStatusFromScore(score),
      score,
      evaluatedAt: this.evaluatedAt ?? new Date().toISOString(),
      kanaResults,
      summary: kanaResults.flatMap((result) => result.summary),
    };
  }
}

function getAverageScore(results: KanaEvaluationResult[]) {
  if (results.length === 0) {
    return 0;
  }

  return Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length);
}

function getStatusFromScore(score: number): EvaluationStatus {
  if (score >= 92) {
    return 'perfect';
  }

  if (score >= 75) {
    return 'good';
  }

  if (score >= 45) {
    return 'almost';
  }

  return 'wrong';
}
