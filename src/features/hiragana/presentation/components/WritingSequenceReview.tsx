import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  ManualWritingReview,
  WritingPracticeResult,
} from '@/src/features/hiragana/domain/models/WritingPracticeResult';
import type { CanvasSize } from '@/src/features/hiragana/presentation/components/DrawingCanvas';
import { StrokePreview } from '@/src/features/hiragana/presentation/components/StrokePreview';
import { getVocabularyImage } from '@/src/shared/assets/imageRegistry';
import { playSound } from '@/src/shared/audio/AudioService';
import { colors } from '@/src/shared/constants/colors';

type WritingSequenceReviewProps = {
  availableWidth: number;
  compact?: boolean;
  correctLabel: string;
  getRemoteImageUrl: (fileName: string) => string | undefined;
  results: WritingPracticeResult[];
  sourceCanvasSize: CanvasSize;
  title: string;
  yourWritingLabel: string;
  manualReviewLabel?: string;
  manualReviewRequiredLabel?: string;
  manualReviewValues?: Record<number, ManualWritingReview | undefined>;
  onManualReviewChange?: (index: number, review: ManualWritingReview) => void;
};

const itemGap = 6;
const compactItemGap = 4;
const maxItemsPerRow = 5;
const maxPreviewSize = 82;
const compactMaxPreviewSize = 50;
const minPreviewSize = 50;
const compactMinPreviewSize = 38;
const previewInset = 4;
const compactPreviewInset = 3;

export function WritingSequenceReview({
  availableWidth,
  compact = false,
  correctLabel,
  getRemoteImageUrl,
  results,
  sourceCanvasSize,
  title,
  yourWritingLabel,
  manualReviewLabel,
  manualReviewRequiredLabel,
  manualReviewValues,
  onManualReviewChange,
}: WritingSequenceReviewProps) {
  const columnCount = getColumnCount(availableWidth, results.length);
  const gap = compact ? compactItemGap : itemGap;
  const inset = compact ? compactPreviewInset : previewInset;
  const itemSize = getItemSize(availableWidth, columnCount, gap, compact);
  const previewSize = Math.max(1, itemSize - inset * 2);
  const sequenceWidth = itemSize * columnCount + gap * (columnCount - 1);
  const correctFontSize = Math.min(compact ? 30 : 42, itemSize * 0.62);
  const exampleImageSize = compact ? Math.max(34, itemSize * 0.82) : itemSize;
  const showManualReview = Boolean(manualReviewValues && onManualReviewChange);
  const reviewedCount = showManualReview
    ? results.filter((_, index) => Boolean(manualReviewValues?.[index])).length
    : 0;

  return (
    <View style={[styles.container, compact ? styles.compactContainer : null]}>
      <View style={styles.header}>
        <Text style={[styles.title, compact ? styles.compactTitle : null]}>{title}</Text>
        {showManualReview ? (
          <Text style={styles.reviewProgress}>
            {manualReviewRequiredLabel ?? 'Revisión'} {reviewedCount} / {results.length}
          </Text>
        ) : null}
      </View>

      <View style={[styles.section, compact ? styles.compactSection : null, styles.userSection]}>
        <View style={[styles.sectionLabelPill, compact ? styles.compactSectionLabelPill : null]}>
          <Text style={[styles.sectionLabel, compact ? styles.compactSectionLabel : null]}>
            {yourWritingLabel}
          </Text>
        </View>
        <View style={[styles.sequence, { gap, width: sequenceWidth }]}>
          {results.map((result, index) => (
            <View
              key={`user-${result.kana}-${index}`}
              style={[
                styles.userReviewItem,
                { width: itemSize },
              ]}>
              <View
                style={[
                  styles.previewItem,
                  compact ? styles.compactPreviewItem : null,
                  { height: itemSize, width: itemSize },
                ]}>
                <StrokePreview
                  size={previewSize}
                  sourceCanvasSize={sourceCanvasSize}
                  strokes={result.userStrokes}
                  strokeWidth={14}
                />
              </View>
              {result.feedbackLabel ? (
                <Text style={[styles.feedbackLabel, compact ? styles.compactFeedbackLabel : null]}>
                  {getFeedbackLabel(result.feedbackLabel, result.feedbackCategory)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, compact ? styles.compactSection : null, styles.correctSection]}>
        <View style={[styles.sectionLabelPill, compact ? styles.compactSectionLabelPill : null]}>
          <Text style={[styles.sectionLabel, compact ? styles.compactSectionLabel : null]}>
            {correctLabel}
          </Text>
        </View>
        <View style={[styles.sequence, { gap, width: sequenceWidth }]}>
          {results.map((result, index) => {
            const exampleImage = resolveResultExampleImage(result, getRemoteImageUrl);

            return (
              <View
                key={`correct-${result.kana}-${index}`}
                style={[styles.correctItem, { width: itemSize }]}>
                <Text
                  style={[
                    styles.correctKana,
                    compact ? styles.compactCorrectKana : null,
                    {
                      fontSize: correctFontSize,
                      height: itemSize,
                      lineHeight: itemSize,
                      width: itemSize,
                    },
                  ]}>
                  {result.kana}
                </Text>
                {exampleImage ? (
                  <View
                    style={[
                      styles.exampleImageFrame,
                      compact ? styles.compactExampleImageFrame : null,
                      { height: exampleImageSize, width: exampleImageSize },
                    ]}>
                    <Image resizeMode="contain" source={exampleImage} style={styles.exampleImage} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      {showManualReview ? (
        <View style={[styles.section, compact ? styles.compactSection : null, styles.manualSection]}>
          <View style={[styles.sectionLabelPill, compact ? styles.compactSectionLabelPill : null]}>
            <Text style={[styles.sectionLabel, compact ? styles.compactSectionLabel : null]}>
              {manualReviewLabel ?? 'Valida tu resultado'}
            </Text>
          </View>
          <View style={styles.manualList}>
            {results.map((result, index) => {
              const exampleImage = resolveResultExampleImage(result, getRemoteImageUrl);

              return (
                <View key={`manual-${result.kana}-${index}`} style={styles.manualItem}>
                  <View style={styles.manualPreviewRow}>
                    <Text style={styles.manualKana}>{result.kana}</Text>
                    <View style={styles.manualStrokePreview}>
                      <StrokePreview
                        size={compact ? 40 : 54}
                        sourceCanvasSize={sourceCanvasSize}
                        strokes={result.userStrokes}
                        strokeWidth={14}
                      />
                    </View>
                    {exampleImage ? (
                      <Image resizeMode="contain" source={exampleImage} style={styles.manualExampleImage} />
                    ) : (
                      <View style={styles.manualExamplePlaceholder} />
                    )}
                  </View>
                  <View style={styles.manualChoices}>
                    {manualReviewOptions.map((option) => (
                      <ManualReviewChip
                        key={option.value}
                        active={manualReviewValues?.[index] === option.value}
                        label={option.label}
                        tone={option.value}
                        onPress={() => onManualReviewChange?.(index, option.value)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const manualReviewOptions: { label: string; value: ManualWritingReview }[] = [
  { label: '👍', value: 'correct' },
  { label: '🤔', value: 'doubtful' },
  { label: '❌', value: 'incorrect' },
];

function ManualReviewChip({
  active,
  label,
  onPress,
  tone,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  tone: ManualWritingReview;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => {
        playSound('tap');
        onPress();
      }}
      style={({ pressed }) => [
        styles.manualChip,
        active ? styles[`manualChip_${tone}`] : null,
        pressed ? styles.manualChipPressed : null,
      ]}>
      <Text style={styles.manualChipText}>{label}</Text>
    </Pressable>
  );
}

function resolveResultExampleImage(
  result: WritingPracticeResult,
  getRemoteImageUrl: (fileName: string) => string | undefined,
) {
  if (result.exampleImageUrl) {
    return { uri: result.exampleImageUrl };
  }

  if (!result.exampleImageKey) {
    return undefined;
  }

  const remoteUrl = getRemoteImageUrl(getVocabularyImageFileName(result.exampleImageKey));

  return remoteUrl ? { uri: remoteUrl } : getVocabularyImage(result.exampleImageKey);
}

function getVocabularyImageFileName(imageKeyOrPath: string) {
  const normalizedPath = imageKeyOrPath.replaceAll('\\', '/');
  const fileName = normalizedPath.split('/').filter(Boolean).pop() ?? imageKeyOrPath;

  return fileName.includes('.') ? fileName : `${fileName}.webp`;
}

function getColumnCount(availableWidth: number, itemCount: number) {
  const preferredColumns = Math.min(maxItemsPerRow, itemCount);
  const minWidthForPreferred =
    preferredColumns * compactMinPreviewSize + compactItemGap * (preferredColumns - 1);

  if (availableWidth >= minWidthForPreferred) {
    return preferredColumns;
  }

  const columnsThatFit = Math.floor(
    (availableWidth + compactItemGap) / (compactMinPreviewSize + compactItemGap),
  );
  return Math.max(1, Math.min(preferredColumns, columnsThatFit));
}

function getItemSize(
  availableWidth: number,
  columnCount: number,
  gap: number,
  compact: boolean,
) {
  const size = (availableWidth - gap * (columnCount - 1)) / columnCount;
  return Math.max(
    compact ? compactMinPreviewSize : minPreviewSize,
    Math.min(compact ? compactMaxPreviewSize : maxPreviewSize, size),
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  compactContainer: {
    gap: 8,
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
  compactTitle: {
    fontSize: 21,
  },
  reviewProgress: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
    textAlign: 'center',
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  compactSection: {
    borderRadius: 14,
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  userSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  correctSection: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    gap: 16,
    paddingVertical: 18,
  },
  manualSection: {
    backgroundColor: '#FFF7DB',
    borderColor: colors.borderStrong,
  },
  sectionLabelPill: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  compactSectionLabelPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  sectionLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  compactSectionLabel: {
    fontSize: 10,
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  compactPreviewItem: {
    borderRadius: 10,
    padding: compactPreviewInset,
  },
  userReviewItem: {
    alignItems: 'center',
    gap: 5,
  },
  feedbackLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  compactFeedbackLabel: {
    fontSize: 9,
  },
  correctKana: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontWeight: '700',
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  compactCorrectKana: {
    borderRadius: 10,
  },
  correctItem: {
    alignItems: 'center',
    gap: 6,
  },
  exampleImageFrame: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 5,
  },
  compactExampleImageFrame: {
    borderRadius: 10,
    padding: 3,
  },
  exampleImage: {
    height: '100%',
    width: '100%',
  },
  manualList: {
    gap: 8,
  },
  manualItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    padding: 8,
  },
  manualPreviewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 8,
    minWidth: 126,
  },
  manualKana: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    minWidth: 36,
    textAlign: 'center',
  },
  manualStrokePreview: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  manualExampleImage: {
    height: 48,
    width: 48,
  },
  manualExamplePlaceholder: {
    height: 48,
    width: 48,
  },
  manualChoices: {
    flexDirection: 'row',
    gap: 6,
  },
  manualChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 48,
  },
  manualChip_correct: {
    backgroundColor: '#EEF6EF',
    borderColor: '#7BB77D',
  },
  manualChip_doubtful: {
    backgroundColor: '#FFF1CA',
    borderColor: '#E1B955',
  },
  manualChip_incorrect: {
    backgroundColor: '#F8ECEA',
    borderColor: colors.primary,
  },
  manualChipPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  manualChipText: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
});

function getFeedbackLabel(label: string, category?: WritingPracticeResult['feedbackCategory']) {
  const marks: Record<NonNullable<WritingPracticeResult['feedbackCategory']>, string> = {
    almost: '🎌',
    good: '👍',
    great: '✨',
    perfect: '🌸',
  };

  return category ? `${label} ${marks[category]}` : label;
}
