import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';

const defaultStrokeWidth = 16;

export function buildStrokeSvgPath(
  points: StrokePoint[],
  strokeWidth = defaultStrokeWidth,
): string {
  if (points.length === 0) {
    return '';
  }

  const [firstPoint, ...remainingPoints] = points;

  if (remainingPoints.length === 0) {
    const dotRadius = strokeWidth / 2;

    return [
      `M ${firstPoint.x} ${firstPoint.y}`,
      `m -${dotRadius} 0`,
      `a ${dotRadius} ${dotRadius} 0 1 0 ${strokeWidth} 0`,
      `a ${dotRadius} ${dotRadius} 0 1 0 -${strokeWidth} 0`,
    ].join(' ');
  }

  if (points.length === 2) {
    const [secondPoint] = remainingPoints;
    return `M ${firstPoint.x} ${firstPoint.y} L ${secondPoint.x} ${secondPoint.y}`;
  }

  return buildSmoothPath(points);
}

function buildSmoothPath(points: StrokePoint[]) {
  const [firstPoint] = points;
  const commands = [`M ${firstPoint.x} ${firstPoint.y}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const currentPoint = points[index];
    const nextPoint = points[index + 1];
    const midPoint = {
      x: (currentPoint.x + nextPoint.x) / 2,
      y: (currentPoint.y + nextPoint.y) / 2,
    };

    commands.push(`Q ${currentPoint.x} ${currentPoint.y} ${midPoint.x} ${midPoint.y}`);
  }

  const lastPoint = points[points.length - 1];
  commands.push(`L ${lastPoint.x} ${lastPoint.y}`);

  return commands.join(' ');
}
