import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import {
  buildPath,
  type CanvasSize,
} from '@/src/features/hiragana/presentation/components/DrawingCanvas';
import { colors } from '@/src/shared/constants/colors';

type StrokePreviewProps = {
  size: number;
  sourceCanvasSize: CanvasSize;
  strokes: StrokePoint[][];
  strokeWidth?: number;
};

export function StrokePreview({
  size,
  sourceCanvasSize,
  strokes,
  strokeWidth = 14,
}: StrokePreviewProps) {
  const viewBoxSize = Math.max(sourceCanvasSize.width, sourceCanvasSize.height, 1);

  return (
    <View style={[styles.container, { height: size, width: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        {strokes.map((stroke, index) => (
          <Path
            key={`preview-stroke-${index}`}
            d={buildPath(stroke)}
            stroke={colors.ink}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
