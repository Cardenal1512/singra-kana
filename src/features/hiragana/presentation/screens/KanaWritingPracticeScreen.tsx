import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { getKanaExamples } from '@/src/features/hiragana/application/useCases/getKanaExamples';
import type { KanaExample } from '@/src/features/hiragana/domain/models/KanaExample';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';
import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { WritingPracticeResult } from '@/src/features/hiragana/domain/models/WritingPracticeResult';
import { hiraganaSeries } from '@/src/features/hiragana/infrastructure/data/hiraganaSeries';
import { StaticKanaExampleRepository } from '@/src/features/hiragana/infrastructure/repositories/StaticKanaExampleRepository';
import {
  DrawingCanvas,
  type CanvasSize,
} from '@/src/features/hiragana/presentation/components/DrawingCanvas';
import { KanaPracticeHeader } from '@/src/features/hiragana/presentation/components/KanaPracticeHeader';
import { ScreenHeader } from '@/src/features/hiragana/presentation/components/ScreenHeader';
import { WritingSequenceReview } from '@/src/features/hiragana/presentation/components/WritingSequenceReview';
import { AppButton } from '@/src/shared/components/AppButton';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { getMascotImage, getVocabularyImage } from '@/src/shared/assets/imageRegistry';
import { colors } from '@/src/shared/constants/colors';
import { useTranslation } from '@/src/shared/i18n/useTranslation';

type KanaWritingPracticeScreenProps = {
  series?: KanaSeries;
  seriesId: string;
  mode: Extract<PracticeMode, 'trace' | 'memory'>;
  onBack: () => void;
};

const initialCanvasSize: CanvasSize = {
  width: 1,
  height: 1,
};

const screenPadding = 18;
const maxPracticeWidth = 560;
const maxReviewWidth = 920;
const reviewLayoutGap = 18;
const reviewMascotColumnWidth = 220;
const kanaExampleRepository = new StaticKanaExampleRepository();

export function KanaWritingPracticeScreen({
  series: providedSeries,
  seriesId,
  mode,
  onBack,
}: KanaWritingPracticeScreenProps) {
  const { language, t } = useTranslation();
  const { width } = useWindowDimensions();
  const series = providedSeries ?? hiraganaSeries.find((item) => item.id === seriesId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userStrokes, setUserStrokes] = useState<StrokePoint[][]>([]);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(initialCanvasSize);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<WritingPracticeResult[]>([]);
  const [currentExample, setCurrentExample] = useState<KanaExample | undefined>();
  const practiceWidth = Math.min(width - screenPadding * 2, maxPracticeWidth);
  const reviewWidth = Math.min(width - screenPadding * 2, maxReviewWidth);
  const isWideReview = reviewWidth >= 760;
  const reviewMainWidth = isWideReview
    ? reviewWidth - reviewMascotColumnWidth - reviewLayoutGap
    : reviewWidth;
  const selectedSeries = series;
  const currentCharacter = selectedSeries?.characters[currentIndex];

  useEffect(() => {
    let isMounted = true;

    async function loadExample() {
      if (!currentCharacter) {
        setCurrentExample(undefined);
        return;
      }

      const examples = await getKanaExamples(currentCharacter.kana, kanaExampleRepository);

      if (isMounted) {
        setCurrentExample(examples[0]);
      }
    }

    loadExample();

    return () => {
      isMounted = false;
    };
  }, [currentCharacter]);

  if (!selectedSeries || !currentCharacter) {
    return (
      <View style={styles.content}>
        <ScreenHeader title="Series not found" onBack={onBack} />
      </View>
    );
  }

  const activeSeries = selectedSeries;
  const activeCharacter = currentCharacter;
  const isTraceMode = mode === 'trace';
  const exampleImage = getVocabularyImage(currentExample?.imageKey);
  const mascotImage = getMascotImage(currentExample?.mascotKey);
  const reviewMascotImage = getMascotImage('singraSearch');

  function clearDrawing() {
    setUserStrokes([]);
  }

  function goToNextCharacter() {
    const nextResult = createPracticeResult();
    const nextResults = [...results, nextResult];
    setResults(nextResults);

    if (currentIndex >= activeSeries.characters.length - 1) {
      setCompleted(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setUserStrokes([]);
  }

  function restartPractice() {
    setCurrentIndex(0);
    setUserStrokes([]);
    setCompleted(false);
    setResults([]);
  }

  function handleChangeStrokes(nextStrokes: StrokePoint[][]) {
    setUserStrokes(nextStrokes);
  }

  function createPracticeResult(): WritingPracticeResult {
    return {
      kana: activeCharacter.kana,
      romaji: activeCharacter.romaji,
      userStrokes,
    };
  }

  if (completed) {
    return (
      <ScrollView contentContainerStyle={styles.reviewScreen}>
        <KawaiiBackground kana={['見', '直', 'あ']} />
        <View style={[styles.reviewContent, { width: reviewWidth }]}>
          <WritingBackButton label={`← ${t.common.back}`} onPress={onBack} />

          <View
            style={[
              styles.reviewBody,
              isWideReview ? styles.reviewBodyWide : styles.reviewBodyStacked,
            ]}>
            <View style={[styles.reviewMain, { width: reviewMainWidth }]}>
              <WritingSequenceReview
                availableWidth={reviewMainWidth}
                correctLabel={t.writing.correct}
                results={results}
                sourceCanvasSize={canvasSize}
                title={t.writing.finalReviewTitle}
                yourWritingLabel={t.writing.yourWriting}
              />
            </View>

            <ReviewMascotPanel
              imageSource={reviewMascotImage}
              isWide={isWideReview}
              width={isWideReview ? reviewMascotColumnWidth : reviewWidth}
            />
          </View>

          <View style={styles.reviewActions}>
            <View style={styles.reviewActionButton}>
              <AppButton label={t.common.restart} onPress={restartPractice} />
            </View>
            <View style={styles.reviewActionButton}>
              <AppButton
                label={t.common.chooseAnotherSeries}
                onPress={onBack}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <KawaiiBackground kana={['書', activeCharacter.kana, 'ん']} />
      <View style={[styles.content, { width: practiceWidth }]}>
        <WritingBackButton label={`← ${t.common.back}`} onPress={onBack} />

        <KanaPracticeHeader
          kana={activeCharacter.kana}
          romaji={activeCharacter.romaji}
          example={currentExample}
          exampleImage={exampleImage}
          language={language}
          mascotImage={mascotImage}
        />

        <View style={styles.canvasArea}>
          <DrawingCanvas
            guideCharacter={activeCharacter.kana}
            showGuide={isTraceMode}
            strokes={userStrokes}
            onChangeCanvasSize={setCanvasSize}
            onChangeStrokes={handleChangeStrokes}
          />
        </View>

        <View style={styles.actions}>
          <View style={styles.clearButton}>
            <AppButton label={t.common.clear} onPress={clearDrawing} variant="secondary" />
          </View>
          <View style={styles.nextButton}>
            <AppButton label={t.common.next} onPress={goToNextCharacter} />
          </View>
        </View>
      </View>
    </View>
  );
}

type WritingBackButtonProps = {
  label: string;
  onPress: () => void;
};

function WritingBackButton({ label, onPress }: WritingBackButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.backButton}>
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

type ReviewMascotPanelProps = {
  imageSource?: ImageSourcePropType;
  isWide: boolean;
  width: number;
};

function ReviewMascotPanel({ imageSource, isWide, width }: ReviewMascotPanelProps) {
  if (!imageSource) {
    return null;
  }

  const imageSize = isWide ? 170 : 136;

  return (
    <View style={[styles.reviewMascotPanel, { width }]}>
      <View
        style={[
          styles.reviewMascotHalo,
          { height: imageSize + 18, width: imageSize + 18 },
        ]}>
        <Image
          source={imageSource}
          resizeMode="contain"
          style={{ height: imageSize, width: imageSize }}
        />
        <Text style={styles.reviewSparkle}>✦</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: screenPadding,
    paddingTop: 10,
    position: 'relative',
  },
  content: {
    gap: 12,
  },
  reviewScreen: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: screenPadding,
    paddingTop: 10,
    position: 'relative',
  },
  reviewContent: {
    gap: 20,
  },
  reviewBody: {
    gap: reviewLayoutGap,
  },
  reviewBodyWide: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reviewBodyStacked: {
    alignItems: 'center',
  },
  reviewMain: {
    flexShrink: 0,
  },
  reviewMascotPanel: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  reviewMascotHalo: {
    alignItems: 'center',
    backgroundColor: '#F4E6A4',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    position: 'relative',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 1,
  },
  reviewSparkle: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    position: 'absolute',
    right: 16,
    top: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  canvasArea: {
    alignItems: 'center',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  clearButton: {
    flexShrink: 0,
  },
  nextButton: {
    flex: 1,
  },
  reviewActions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  reviewActionButton: {
    flex: 1,
    minWidth: 180,
  },
});
