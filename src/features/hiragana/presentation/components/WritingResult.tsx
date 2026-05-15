import { StyleSheet, Text, View } from 'react-native';

import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { CanvasSize } from '@/src/features/hiragana/presentation/components/DrawingCanvas';
import { StrokePreview } from '@/src/features/hiragana/presentation/components/StrokePreview';
import { colors } from '@/src/shared/constants/colors';

type WritingResultProps = {
  correctKana: string;
  sourceCanvasSize: CanvasSize;
  userStrokes: StrokePoint[][];
};

const previewSize = 168;

export function WritingResult({
  correctKana,
  sourceCanvasSize,
  userStrokes,
}: WritingResultProps) {
  const viewBoxSize = Math.max(sourceCanvasSize.width, sourceCanvasSize.height, 1);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Your answer</Text>
        <View style={styles.preview}>
          <StrokePreview
            size={previewSize}
            sourceCanvasSize={{ width: viewBoxSize, height: viewBoxSize }}
            strokes={userStrokes}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Correct answer</Text>
        <View style={styles.correctAnswer}>
          <Text style={styles.correctKana}>{correctKana}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  section: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  preview: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: previewSize,
    justifyContent: 'center',
    overflow: 'hidden',
    width: previewSize,
  },
  correctAnswer: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 136,
    justifyContent: 'center',
    width: previewSize,
  },
  correctKana: {
    color: colors.text,
    fontSize: 92,
    fontWeight: '700',
    lineHeight: 112,
  },
});
