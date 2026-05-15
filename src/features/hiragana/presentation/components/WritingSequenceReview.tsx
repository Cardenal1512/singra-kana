import { StyleSheet, Text, View } from 'react-native';

import type { WritingPracticeResult } from '@/src/features/hiragana/domain/models/WritingPracticeResult';
import type { CanvasSize } from '@/src/features/hiragana/presentation/components/DrawingCanvas';
import { StrokePreview } from '@/src/features/hiragana/presentation/components/StrokePreview';
import { colors } from '@/src/shared/constants/colors';

type WritingSequenceReviewProps = {
  availableWidth: number;
  correctLabel: string;
  results: WritingPracticeResult[];
  sourceCanvasSize: CanvasSize;
  title: string;
  yourWritingLabel: string;
};

const itemGap = 6;
const maxItemsPerRow = 5;
const maxPreviewSize = 82;
const minPreviewSize = 50;
const previewInset = 4;

export function WritingSequenceReview({
  availableWidth,
  correctLabel,
  results,
  sourceCanvasSize,
  title,
  yourWritingLabel,
}: WritingSequenceReviewProps) {
  const columnCount = getColumnCount(availableWidth, results.length);
  const itemSize = getItemSize(availableWidth, columnCount);
  const previewSize = Math.max(1, itemSize - previewInset * 2);
  const sequenceWidth = itemSize * columnCount + itemGap * (columnCount - 1);
  const correctFontSize = Math.min(42, itemSize * 0.62);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{yourWritingLabel}</Text>
        <View style={[styles.sequence, { gap: itemGap, width: sequenceWidth }]}>
          {results.map((result, index) => (
            <View
              key={`user-${result.kana}-${index}`}
              style={[styles.previewItem, { height: itemSize, width: itemSize }]}>
              <StrokePreview
                size={previewSize}
                sourceCanvasSize={sourceCanvasSize}
                strokes={result.userStrokes}
                strokeWidth={14}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{correctLabel}</Text>
        <View style={[styles.sequence, { gap: itemGap, width: sequenceWidth }]}>
          {results.map((result, index) => (
            <Text
              key={`correct-${result.kana}-${index}`}
              style={[
                styles.correctKana,
                {
                  fontSize: correctFontSize,
                  height: itemSize,
                  lineHeight: itemSize,
                  width: itemSize,
                },
              ]}>
              {result.kana}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function getColumnCount(availableWidth: number, itemCount: number) {
  const preferredColumns = Math.min(maxItemsPerRow, itemCount);
  const minWidthForPreferred =
    preferredColumns * minPreviewSize + itemGap * (preferredColumns - 1);

  if (availableWidth >= minWidthForPreferred) {
    return preferredColumns;
  }

  const columnsThatFit = Math.floor((availableWidth + itemGap) / (minPreviewSize + itemGap));
  return Math.max(1, Math.min(preferredColumns, columnsThatFit));
}

function getItemSize(availableWidth: number, columnCount: number) {
  const size = (availableWidth - itemGap * (columnCount - 1)) / columnCount;
  return Math.max(minPreviewSize, Math.min(maxPreviewSize, size));
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  sequence: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  previewItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    padding: previewInset,
  },
  correctKana: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
