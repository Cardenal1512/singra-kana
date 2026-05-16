import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
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
import { AppScreen } from '@/src/shared/components/AppScreen';
import { CompletionModal } from '@/src/shared/components/CompletionModal';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { getMascotImage, getVocabularyImage } from '@/src/shared/assets/imageRegistry';
import { colors } from '@/src/shared/constants/colors';
import { useTranslation } from '@/src/shared/i18n/useTranslation';
import { FloatingView } from '@/src/shared/motion/FloatingView';

type KanaWritingPracticeScreenProps = {
  series?: KanaSeries;
  seriesId: string;
  mode: Extract<PracticeMode, 'trace' | 'memory'>;
  onBack: () => void;
  onNextSeries: () => void;
  onRepeatSeries: () => void;
};

const initialCanvasSize: CanvasSize = {
  width: 1,
  height: 1,
};

const screenPadding = 18;
const maxPracticeWidth = 560;
const maxReviewWidth = 920;
const reviewLayoutGap = 8;
const reviewMascotColumnWidth = 220;
const kanaExampleRepository = new StaticKanaExampleRepository();

export function KanaWritingPracticeScreen({
  series: providedSeries,
  seriesId,
  mode,
  onBack,
  onNextSeries,
  onRepeatSeries,
}: KanaWritingPracticeScreenProps) {
  const { language, t } = useTranslation();
  const { height, width } = useWindowDimensions();
  const series = providedSeries ?? hiraganaSeries.find((item) => item.id === seriesId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userStrokes, setUserStrokes] = useState<StrokePoint[][]>([]);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(initialCanvasSize);
  const [completed, setCompleted] = useState(false);
  const [helpGuideVisible, setHelpGuideVisible] = useState(false);
  const [results, setResults] = useState<WritingPracticeResult[]>([]);
  const [currentExample, setCurrentExample] = useState<KanaExample | undefined>();
  const practiceWidth = Math.min(width - screenPadding * 2, maxPracticeWidth);
  const reviewWidth = Math.min(width - screenPadding * 2, maxReviewWidth);
  const isWideReview = reviewWidth >= 760;
  const isCompactReview = width < 720 || height < 780;
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
  const shouldShowGuide = isTraceMode || helpGuideVisible;
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
      setHelpGuideVisible(false);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setUserStrokes([]);
    setHelpGuideVisible(false);
  }

  function restartPractice() {
    setCurrentIndex(0);
    setUserStrokes([]);
    setCompleted(false);
    setHelpGuideVisible(false);
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
      <AppScreen
        background={<KawaiiBackground kana={['見', '直', 'あ']} />}
        header={
          <View style={[styles.reviewHeader, { width: reviewWidth }]}>
            <WritingBackButton label={t.common.back} onPress={onBack} />
          </View>
        }
        footer={
          <View style={[styles.reviewFooter, { width: reviewWidth }]}>
            <CompletionModal
              compact={isCompactReview}
              onChangeMode={onBack}
              onNext={onNextSeries}
              onRepeat={activeSeries.id === 'random' ? onRepeatSeries : restartPractice}
            />
          </View>
        }>
        <View style={[styles.reviewContent, { width: reviewWidth }]}>
          <View
            style={[
              styles.reviewBody,
              isWideReview ? styles.reviewBodyWide : styles.reviewBodyStacked,
            ]}>
            <View style={[styles.reviewMain, { width: reviewMainWidth }]}>
              <WritingSequenceReview
                availableWidth={reviewMainWidth}
                compact={isCompactReview}
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
              compact={isCompactReview}
              width={isWideReview ? reviewMascotColumnWidth : reviewWidth}
            />
          </View>

        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      background={<KawaiiBackground kana={['書', activeCharacter.kana, 'ん']} />}
      header={
        <View style={[styles.topBar, { width: practiceWidth }]}>
          <WritingBackButton label={t.common.back} onPress={onBack} />
          {!isTraceMode ? (
            <HelpButton
              label={t.common.help}
              onShow={() => setHelpGuideVisible(true)}
              onHide={() => setHelpGuideVisible(false)}
            />
          ) : null}
        </View>
      }
      footer={
        <View style={[styles.actions, { width: practiceWidth }]}>
          <View style={styles.clearButton}>
            <AppButton label={t.common.clear} onPress={clearDrawing} variant="secondary" />
          </View>
          <View style={styles.nextButton}>
            <AppButton label={t.common.next} onPress={goToNextCharacter} />
          </View>
        </View>
      }>
      <View style={[styles.content, { width: practiceWidth }]}>
        <KanaPracticeHeader
          kana={activeCharacter.kana}
          romaji={activeCharacter.romaji}
          example={currentExample}
          exampleImage={exampleImage}
          language={language}
          mascotImage={mascotImage}
          showKanaInfo={isTraceMode}
        />

        <View style={styles.canvasArea}>
          <DrawingCanvas
            guideCharacter={activeCharacter.kana}
            showGuide={shouldShowGuide}
            strokes={userStrokes}
            onChangeCanvasSize={setCanvasSize}
            onChangeStrokes={handleChangeStrokes}
          />
        </View>

      </View>
    </AppScreen>
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

type HelpButtonProps = {
  label: string;
  onHide: () => void;
  onShow: () => void;
};

function HelpButton({ label, onHide, onShow }: HelpButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onHoverOut={onHide}
      onPressIn={onShow}
      onPressOut={onHide}
      onResponderTerminate={onHide}
      onTouchCancel={onHide}
      style={({ pressed }) => [styles.helpButton, pressed ? styles.helpButtonPressed : null]}>
      <Text style={styles.helpText}>{label}</Text>
    </Pressable>
  );
}

type ReviewMascotPanelProps = {
  compact: boolean;
  imageSource?: ImageSourcePropType;
  isWide: boolean;
  width: number;
};

function ReviewMascotPanel({ compact, imageSource, isWide, width }: ReviewMascotPanelProps) {
  if (!imageSource) {
    return null;
  }

  const imageSize = compact ? 72 : isWide ? 170 : 120;

  return (
    <View style={[styles.reviewMascotPanel, { width }]}>
      <FloatingView>
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
      </FloatingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    padding: screenPadding,
    paddingTop: 10,
    position: 'relative',
  },
  content: {
    gap: 12,
    position: 'relative',
    zIndex: 1,
  },
  topBar: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
    width: '100%',
    zIndex: 2,
  },
  reviewScreen: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 10,
    paddingTop: 8,
    position: 'relative',
  },
  reviewContent: {
    gap: 8,
  },
  reviewHeader: {
    alignSelf: 'center',
  },
  reviewFooter: {
    alignSelf: 'center',
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
    marginVertical: -2,
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
    minWidth: 86,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  helpButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderColor: colors.primaryPressed,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 78,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 1,
  },
  helpButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  helpText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900',
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
});
