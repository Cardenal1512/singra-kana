import { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
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
  const [practiceCharacters, setPracticeCharacters] = useState<KanaSeries['characters']>(() =>
    series ? shuffleCharacters(series.characters) : [],
  );
  const [currentExample, setCurrentExample] = useState<KanaExample | undefined>();
  const practiceWidth = Math.min(width - screenPadding * 2, maxPracticeWidth);
  const reviewWidth = Math.min(width - screenPadding * 2, maxReviewWidth);
  const isCompactReview = width < 720 || height < 780;
  const reviewMainWidth = reviewWidth;
  const selectedSeries = series;
  const currentCharacter = practiceCharacters[currentIndex];

  useEffect(() => {
    if (!selectedSeries) {
      setPracticeCharacters([]);
      return;
    }

    setPracticeCharacters(shuffleCharacters(selectedSeries.characters));
    setCurrentIndex(0);
    setUserStrokes([]);
    setCompleted(false);
    setHelpGuideVisible(false);
    setResults([]);
  }, [selectedSeries]);

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
  const hasUserStrokes = userStrokes.some((stroke) => stroke.length > 0);
  const shouldShowGuide = isTraceMode || helpGuideVisible;
  const exampleImage = getVocabularyImage(currentExample?.imageKey);
  const mascotImage = getMascotImage(currentExample?.mascotKey);
  const reviewMascotImage = getMascotImage('singraSearch');
  const nextSeries = getNextSeriesForReview(activeSeries);
  const nextSeriesLabel = getReviewSeriesLabel(nextSeries, language);
  const activeSeriesLabel = getReviewSeriesLabel(activeSeries, language);

  function clearDrawing() {
    setUserStrokes([]);
  }

  function goToNextCharacter() {
    const nextResult = createPracticeResult();
    const nextResults = [...results];
    nextResults[currentIndex] = nextResult;
    setResults(nextResults);

    if (currentIndex >= practiceCharacters.length - 1) {
      setCompleted(true);
      setHelpGuideVisible(false);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setUserStrokes(nextResults[nextIndex]?.userStrokes ?? []);
    setHelpGuideVisible(false);
  }

  function goToPreviousCharacter() {
    if (currentIndex === 0) {
      return;
    }

    commitCurrentResult();
    const previousIndex = currentIndex - 1;
    setCurrentIndex(previousIndex);
    setUserStrokes(results[previousIndex]?.userStrokes ?? []);
    setHelpGuideVisible(false);
  }

  function restartPractice() {
    setPracticeCharacters(shuffleCharacters(activeSeries.characters));
    setCurrentIndex(0);
    setUserStrokes([]);
    setCompleted(false);
    setHelpGuideVisible(false);
    setResults([]);
  }

  function handleChangeStrokes(nextStrokes: StrokePoint[][]) {
    setUserStrokes(nextStrokes);
  }

  function commitCurrentResult() {
    const nextResult = createPracticeResult();
    setResults((currentResults) => {
      const nextResults = [...currentResults];
      nextResults[currentIndex] = nextResult;
      return nextResults;
    });
  }

  function createPracticeResult(): WritingPracticeResult {
    return {
      exampleImageKey: currentExample?.imageKey,
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
              heroImageSource={reviewMascotImage}
              nextLabel={
                language === 'es'
                  ? `Siguiente: ${nextSeriesLabel}`
                  : `Next: ${nextSeriesLabel}`
              }
              onChangeMode={onBack}
              onNext={onNextSeries}
              onRepeat={activeSeries.id === 'random' ? onRepeatSeries : restartPractice}
              repeatLabel={
                language === 'es'
                  ? `Repetir ${activeSeriesLabel}`
                  : `Repeat ${activeSeriesLabel}`
              }
            />
          </View>
        }>
        <View style={[styles.reviewContent, { width: reviewWidth }]}>
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
          <StepButton
            disabled={currentIndex === 0}
            label={language === 'es' ? 'Anterior' : 'Previous'}
            onPress={goToPreviousCharacter}
          />
          <ClearIconButton label={t.common.clear} onPress={clearDrawing} />
          <StepButton
            disabled={!hasUserStrokes}
            label={
              currentIndex >= practiceCharacters.length - 1
                ? language === 'es'
                  ? 'Finalizar'
                  : 'Finish'
                : t.common.next
            }
            primary
            onPress={goToNextCharacter}
          />
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

type StepButtonProps = {
  disabled?: boolean;
  label: string;
  primary?: boolean;
  onPress: () => void;
};

function StepButton({ disabled = false, label, primary = false, onPress }: StepButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepButton,
        primary ? styles.stepButtonPrimary : styles.stepButtonSecondary,
        disabled ? styles.stepButtonDisabled : null,
        pressed && !disabled ? styles.stepButtonPressed : null,
      ]}>
      <Text
        style={[
          styles.stepButtonText,
          primary ? styles.stepButtonTextPrimary : null,
          disabled ? styles.stepButtonTextDisabled : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

type ClearIconButtonProps = {
  label: string;
  onPress: () => void;
};

function ClearIconButton({ label, onPress }: ClearIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.clearIconButton, pressed ? styles.stepButtonPressed : null]}>
      <MaterialIcons name="delete-outline" size={24} color={colors.primary} />
    </Pressable>
  );
}

type ReviewMascotPanelProps = {
  compact: boolean;
  imageSource?: ImageSourcePropType;
  isWide: boolean;
  width: number;
};

export function ReviewMascotPanel({ compact, imageSource, isWide, width }: ReviewMascotPanelProps) {
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
    gap: 10,
    justifyContent: 'space-between',
  },
  stepButton: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  stepButtonPrimary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 1,
  },
  stepButtonSecondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  stepButtonDisabled: {
    backgroundColor: colors.disabledSurface,
    borderColor: colors.border,
    opacity: 0.62,
  },
  stepButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  stepButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  stepButtonTextPrimary: {
    color: colors.onPrimary,
  },
  stepButtonTextDisabled: {
    color: colors.disabledText,
  },
  clearIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
});

function shuffleCharacters(characters: KanaSeries['characters']) {
  const shuffledCharacters = [...characters];

  for (let index = shuffledCharacters.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentCharacter = shuffledCharacters[index];
    shuffledCharacters[index] = shuffledCharacters[randomIndex];
    shuffledCharacters[randomIndex] = currentCharacter;
  }

  return shuffledCharacters;
}

function getNextSeriesForReview(currentSeries: KanaSeries) {
  if (currentSeries.id === 'random') {
    return currentSeries;
  }

  const currentIndex = hiraganaSeries.findIndex((item) => item.id === currentSeries.id);

  if (currentIndex === -1) {
    return hiraganaSeries[0] ?? currentSeries;
  }

  return hiraganaSeries[(currentIndex + 1) % hiraganaSeries.length];
}

function getReviewSeriesLabel(series: KanaSeries, language: 'en' | 'es') {
  if (series.id === 'random') {
    return language === 'es' ? 'random' : 'random';
  }

  if (series.id === 'vowels') {
    return language === 'es' ? 'Vocales' : 'Vowels';
  }

  return series.title.replace(/ Series$/u, '');
}
