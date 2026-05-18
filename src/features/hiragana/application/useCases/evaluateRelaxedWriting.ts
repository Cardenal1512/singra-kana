import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { RelaxedWritingCategory } from '@/src/features/hiragana/domain/models/RelaxedWritingCategory';
import type { WritingTemplate } from '@/src/features/hiragana/domain/models/WritingTemplate';

export type RelaxedWritingEvaluation = {
  category: RelaxedWritingCategory;
  message: string;
  score: number;
  singraMessage: string;
};

type CanvasSize = {
  width: number;
  height: number;
};

type EvaluateRelaxedWritingOptions = {
  canvasSize: CanvasSize;
  kana: string;
  strokes: StrokePoint[][];
  template?: WritingTemplate;
};

type Bounds = {
  height: number;
  width: number;
};

const categoryRank: Record<RelaxedWritingCategory, number> = {
  almost: 0,
  good: 1,
  great: 2,
  perfect: 3,
};

const categoriesByRank: RelaxedWritingCategory[] = ['almost', 'good', 'great', 'perfect'];

const feedbackByCategory: Record<RelaxedWritingCategory, { message: string; singra: string }> = {
  perfect: {
    message: 'Perfecto',
    singra: 'すごい!',
  },
  great: {
    message: 'Muy bien',
    singra: 'いいね!',
  },
  good: {
    message: 'Bien hecho',
    singra: 'やった!',
  },
  almost: {
    message: 'Casi',
    singra: 'もういっかい!',
  },
};

const expectedStrokeCounts: Record<string, number> = {
  あ: 3,
  い: 2,
  う: 2,
  え: 2,
  お: 3,
  か: 3,
  き: 4,
  く: 1,
  け: 3,
  こ: 2,
  さ: 3,
  し: 1,
  す: 2,
  せ: 3,
  そ: 1,
  た: 4,
  ち: 2,
  つ: 1,
  て: 1,
  と: 2,
  な: 4,
  に: 3,
  ぬ: 2,
  ね: 2,
  の: 1,
  は: 3,
  ひ: 1,
  ふ: 4,
  へ: 1,
  ほ: 4,
  ま: 3,
  み: 2,
  む: 3,
  め: 2,
  も: 3,
  や: 3,
  ゆ: 2,
  よ: 2,
  ら: 2,
  り: 2,
  る: 1,
  れ: 2,
  ろ: 1,
  わ: 2,
  を: 3,
  ん: 1,
};

export function evaluateRelaxedWriting({
  canvasSize,
  kana,
  strokes,
  template,
}: EvaluateRelaxedWritingOptions): RelaxedWritingEvaluation {
  const nonEmptyStrokes = strokes.filter((stroke) => stroke.length >= 2);
  const points = nonEmptyStrokes.flat();

  if (points.length === 0 || canvasSize.width <= 0 || canvasSize.height <= 0) {
    return buildEvaluation('almost', 0);
  }

  const expectedStrokeCount = getExpectedStrokeCount(kana, template);
  const expectedTotalLength = getExpectedTotalLength(kana, template, canvasSize);
  const totalLength = getTotalLength(nonEmptyStrokes);
  const lengthRatio = totalLength / expectedTotalLength;
  const bounds = getBounds(points);
  const coverageScore = getCoverageScore(bounds, canvasSize);
  const boundingBoxScore = getBoundingBoxScore(bounds, canvasSize);
  const strokeCountScore = getStrokeCountScore(nonEmptyStrokes.length, expectedStrokeCount);
  const perStrokeCoverageScore = getPerStrokeCoverageScore(
    nonEmptyStrokes,
    expectedStrokeCount,
    expectedTotalLength,
  );
  const directionScore = getDirectionScore(nonEmptyStrokes, template, expectedStrokeCount);

  const rawScore = Math.round(
    strokeCountScore * 22 +
      coverageScore * 26 +
      perStrokeCoverageScore * 22 +
      directionScore * 16 +
      boundingBoxScore * 14,
  );
  const cappedCategory = applyCategoryCaps(
    getCategoryFromScore(rawScore),
    {
      boundingBoxScore,
      coverageScore,
      directionScore,
      expectedStrokeCount,
      lengthRatio,
      nonEmptyStrokeCount: nonEmptyStrokes.length,
      perStrokeCoverageScore,
    },
  );

  return buildEvaluation(cappedCategory, rawScore);
}

function buildEvaluation(category: RelaxedWritingCategory, score: number): RelaxedWritingEvaluation {
  const feedback = feedbackByCategory[category];

  return {
    category,
    message: feedback.message,
    score,
    singraMessage: feedback.singra,
  };
}

function getExpectedStrokeCount(kana: string, template?: WritingTemplate) {
  return template?.strokes.length ?? expectedStrokeCounts[kana] ?? 2;
}

function getExpectedTotalLength(
  kana: string,
  template: WritingTemplate | undefined,
  canvasSize: CanvasSize,
) {
  const scale = Math.min(canvasSize.width, canvasSize.height) / 100;

  if (template) {
    return (
      template.strokes.reduce((sum, stroke) => {
        const templatePoints = [stroke.startPoint, ...stroke.checkpoints, stroke.endPoint];
        return sum + getPolylineLength(templatePoints) * scale;
      }, 0) * 0.82
    );
  }

  const expectedStrokeCount = getExpectedStrokeCount(kana, template);
  const baseLengthByStroke = Math.min(canvasSize.width, canvasSize.height) * 0.3;
  return Math.max(baseLengthByStroke, expectedStrokeCount * baseLengthByStroke);
}

function getStrokeCountScore(actualStrokeCount: number, expectedStrokeCount: number) {
  if (actualStrokeCount >= expectedStrokeCount) {
    return clamp01(1 - (actualStrokeCount - expectedStrokeCount) * 0.1);
  }

  return clamp01(actualStrokeCount / expectedStrokeCount);
}

function getCoverageScore(bounds: Bounds, canvasSize: CanvasSize) {
  const widthCoverage = bounds.width / Math.max(canvasSize.width, 1);
  const heightCoverage = bounds.height / Math.max(canvasSize.height, 1);
  const areaCoverage = widthCoverage * heightCoverage;

  return clamp01(widthCoverage / 0.46) * 0.34 + clamp01(heightCoverage / 0.46) * 0.34 + clamp01(areaCoverage / 0.18) * 0.32;
}

function getBoundingBoxScore(bounds: Bounds, canvasSize: CanvasSize) {
  const widthCoverage = bounds.width / Math.max(canvasSize.width, 1);
  const heightCoverage = bounds.height / Math.max(canvasSize.height, 1);
  const smallestAxis = Math.min(widthCoverage, heightCoverage);
  const largestAxis = Math.max(widthCoverage, heightCoverage);

  return clamp01(smallestAxis / 0.28) * 0.55 + clamp01(largestAxis / 0.48) * 0.45;
}

function getPerStrokeCoverageScore(
  strokes: StrokePoint[][],
  expectedStrokeCount: number,
  expectedTotalLength: number,
) {
  const expectedLengthPerStroke = expectedTotalLength / expectedStrokeCount;
  const presentStrokeScores = strokes
    .slice(0, expectedStrokeCount)
    .map((stroke) => clamp01(getPolylineLength(stroke) / (expectedLengthPerStroke * 0.72)));
  const missingStrokeCount = Math.max(0, expectedStrokeCount - presentStrokeScores.length);
  const allStrokeScores = [
    ...presentStrokeScores,
    ...Array.from({ length: missingStrokeCount }, () => 0),
  ];

  return allStrokeScores.reduce((sum, score) => sum + score, 0) / expectedStrokeCount;
}

function getDirectionScore(
  strokes: StrokePoint[][],
  template: WritingTemplate | undefined,
  expectedStrokeCount: number,
) {
  if (!template) {
    return clamp01(strokes.length / expectedStrokeCount);
  }

  const scores = template.strokes.map((expectedStroke, index) => {
    const actualStroke = strokes[index];

    if (!actualStroke || actualStroke.length < 2) {
      return 0;
    }

    const expectedVector = {
      x: expectedStroke.endPoint.x - expectedStroke.startPoint.x,
      y: expectedStroke.endPoint.y - expectedStroke.startPoint.y,
    };
    const actualVector = {
      x: actualStroke[actualStroke.length - 1].x - actualStroke[0].x,
      y: actualStroke[actualStroke.length - 1].y - actualStroke[0].y,
    };

    return getVectorSimilarity(actualVector, expectedVector);
  });

  return scores.reduce((sum, score) => sum + score, 0) / template.strokes.length;
}

function applyCategoryCaps(
  category: RelaxedWritingCategory,
  metrics: {
    boundingBoxScore: number;
    coverageScore: number;
    directionScore: number;
    expectedStrokeCount: number;
    lengthRatio: number;
    nonEmptyStrokeCount: number;
    perStrokeCoverageScore: number;
  },
) {
  let cappedCategory = category;

  if (metrics.expectedStrokeCount > 1 && metrics.nonEmptyStrokeCount <= 1) {
    cappedCategory = minCategory(cappedCategory, 'almost');
  }

  if (metrics.lengthRatio < 0.38) {
    cappedCategory = minCategory(cappedCategory, 'almost');
  } else if (metrics.lengthRatio < 0.62) {
    cappedCategory = minCategory(cappedCategory, 'good');
  }

  if (metrics.nonEmptyStrokeCount < Math.ceil(metrics.expectedStrokeCount * 0.55)) {
    cappedCategory = minCategory(cappedCategory, 'almost');
  } else if (metrics.nonEmptyStrokeCount < Math.ceil(metrics.expectedStrokeCount * 0.75)) {
    cappedCategory = minCategory(cappedCategory, 'good');
  }

  if (metrics.coverageScore < 0.45) {
    cappedCategory = minCategory(cappedCategory, 'almost');
  } else if (metrics.coverageScore < 0.6) {
    cappedCategory = minCategory(cappedCategory, 'good');
  } else if (metrics.coverageScore < 0.75) {
    cappedCategory = minCategory(cappedCategory, 'great');
  }

  if (metrics.perStrokeCoverageScore < 0.42) {
    cappedCategory = minCategory(cappedCategory, 'almost');
  } else if (metrics.perStrokeCoverageScore < 0.6) {
    cappedCategory = minCategory(cappedCategory, 'good');
  }

  if (metrics.boundingBoxScore < 0.58) {
    cappedCategory = minCategory(cappedCategory, 'good');
  } else if (metrics.boundingBoxScore < 0.75) {
    cappedCategory = minCategory(cappedCategory, 'great');
  }

  if (metrics.directionScore < 0.48) {
    cappedCategory = minCategory(cappedCategory, 'good');
  }

  return cappedCategory;
}

function getCategoryFromScore(score: number): RelaxedWritingCategory {
  if (score >= 86) {
    return 'perfect';
  }

  if (score >= 68) {
    return 'great';
  }

  if (score >= 42) {
    return 'good';
  }

  return 'almost';
}

function minCategory(
  category: RelaxedWritingCategory,
  maxCategory: RelaxedWritingCategory,
): RelaxedWritingCategory {
  return categoriesByRank[Math.min(categoryRank[category], categoryRank[maxCategory])];
}

function getTotalLength(strokes: StrokePoint[][]) {
  return strokes.reduce((sum, stroke) => sum + getPolylineLength(stroke), 0);
}

function getPolylineLength(points: StrokePoint[]) {
  return points.reduce((sum, point, index) => {
    if (index === 0) {
      return sum;
    }

    const previousPoint = points[index - 1];
    return sum + Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
  }, 0);
}

function getBounds(points: StrokePoint[]): Bounds {
  const bounds = points.reduce(
    (currentBounds, point) => ({
      maxX: Math.max(currentBounds.maxX, point.x),
      maxY: Math.max(currentBounds.maxY, point.y),
      minX: Math.min(currentBounds.minX, point.x),
      minY: Math.min(currentBounds.minY, point.y),
    }),
    {
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
    },
  );

  return {
    height: Math.max(0, bounds.maxY - bounds.minY),
    width: Math.max(0, bounds.maxX - bounds.minX),
  };
}

function getVectorSimilarity(
  firstVector: { x: number; y: number },
  secondVector: { x: number; y: number },
) {
  const firstLength = Math.hypot(firstVector.x, firstVector.y);
  const secondLength = Math.hypot(secondVector.x, secondVector.y);

  if (firstLength === 0 || secondLength === 0) {
    return 0;
  }

  const cosine =
    (firstVector.x * secondVector.x + firstVector.y * secondVector.y) /
    (firstLength * secondLength);

  return clamp01((cosine + 1) / 2);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
