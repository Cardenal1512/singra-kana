import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { WritingEvaluation } from '@/src/features/hiragana/domain/models/WritingEvaluation';

const pointsForFullScore = 160;

export function evaluateCompletedWriting(userStrokes: StrokePoint[][]): WritingEvaluation {
  const pointCount = userStrokes.reduce((sum, stroke) => sum + stroke.length, 0);

  if (pointCount === 0) {
    return {
      score: 0,
      isAccepted: false,
    };
  }

  const score = Math.min(100, Math.round((pointCount / pointsForFullScore) * 100));

  return {
    score,
    isAccepted: score > 0,
  };
}
