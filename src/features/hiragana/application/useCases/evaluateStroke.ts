import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { WritingEvaluation } from '@/src/features/hiragana/domain/models/WritingEvaluation';
import type { WritingStrokeTemplate } from '@/src/features/hiragana/domain/models/WritingTemplate';

const defaultAcceptanceThreshold = 55;
const defaultTolerance = 22;

type EvaluateStrokeOptions = {
  acceptanceThreshold?: number;
  tolerance?: number;
};

export function evaluateStroke(
  points: StrokePoint[],
  strokeTemplate: WritingStrokeTemplate,
  options: EvaluateStrokeOptions = {},
): WritingEvaluation {
  const acceptanceThreshold = options.acceptanceThreshold ?? defaultAcceptanceThreshold;
  const tolerance = options.tolerance ?? defaultTolerance;

  if (points.length < 2) {
    return {
      score: 0,
      isAccepted: false,
    };
  }

  const startScore = getPointScore(points[0], strokeTemplate.startPoint, tolerance);
  const endScore = getPointScore(points[points.length - 1], strokeTemplate.endPoint, tolerance);
  const checkpointScore = getCheckpointScore(points, strokeTemplate.checkpoints, tolerance);
  const score = Math.round(startScore * 0.25 + endScore * 0.25 + checkpointScore * 0.5);

  return {
    score,
    isAccepted: score >= acceptanceThreshold,
  };
}

function getCheckpointScore(
  points: StrokePoint[],
  checkpoints: StrokePoint[],
  tolerance: number,
) {
  if (checkpoints.length === 0) {
    return 100;
  }

  const totalScore = checkpoints.reduce((sum, checkpoint) => {
    const bestScore = Math.max(
      ...points.map((point) => getPointScore(point, checkpoint, tolerance)),
    );

    return sum + bestScore;
  }, 0);

  return totalScore / checkpoints.length;
}

function getPointScore(point: StrokePoint, expectedPoint: StrokePoint, tolerance: number) {
  const distance = Math.hypot(point.x - expectedPoint.x, point.y - expectedPoint.y);
  return Math.max(0, 1 - distance / tolerance) * 100;
}
