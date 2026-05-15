import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { WritingEvaluation } from '@/src/features/hiragana/domain/models/WritingEvaluation';

type CanvasSize = {
  width: number;
  height: number;
};

export function evaluateBasicWriting(
  points: StrokePoint[],
  canvasSize: CanvasSize,
): WritingEvaluation {
  if (points.length === 0 || canvasSize.width === 0 || canvasSize.height === 0) {
    return {
      score: 0,
      isAccepted: false,
    };
  }

  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;
  const maxDistance = Math.hypot(centerX, centerY);

  const totalDistance = points.reduce((sum, point) => {
    return sum + Math.hypot(point.x - centerX, point.y - centerY);
  }, 0);

  const averageDistanceFromCenter = totalDistance / points.length;
  const pointCoverageScore = Math.min(points.length / 120, 1) * 55;
  const centerScore = Math.max(0, 1 - averageDistanceFromCenter / maxDistance) * 45;

  return {
    score: Math.round(pointCoverageScore + centerScore),
    isAccepted: true,
  };
}
