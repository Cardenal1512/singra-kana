import type {
  HandwritingEvaluationRequest,
  HandwritingEvaluationResult,
} from '@/src/features/hiragana/domain/models/HandwritingEvaluation';

export interface HandwritingEvaluationPort {
  evaluate(request: HandwritingEvaluationRequest): Promise<HandwritingEvaluationResult>;
}
