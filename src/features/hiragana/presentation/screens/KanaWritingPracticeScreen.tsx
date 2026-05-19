import { useEffect, useRef, useState } from 'react';
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

import {
  evaluateRelaxedWriting,
  type RelaxedWritingEvaluation,
} from '@/src/features/hiragana/application/useCases/evaluateRelaxedWriting';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';
import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { VocabularyImage } from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { WritingTemplate } from '@/src/features/hiragana/domain/models/WritingTemplate';
import type { WritingPracticeResult } from '@/src/features/hiragana/domain/models/WritingPracticeResult';
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
  getRemoteImageUrl: (fileName: string) => string | undefined;
  loadWritingTemplate: (kana: string) => Promise<WritingTemplate | undefined>;
  loadVocabularyByKana: (kana: string) => Promise<VocabularyItem[]>;
  series?: KanaSeries;
  seriesOptions: KanaSeries[];
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

export function KanaWritingPracticeScreen({
  getRemoteImageUrl,
  loadWritingTemplate,
  loadVocabularyByKana,
  series: providedSeries,
  seriesOptions,
  seriesId,
  mode,
  onBack,
  onNextSeries,
  onRepeatSeries,
}: KanaWritingPracticeScreenProps) {
  const { language, t } = useTranslation();
  const { height, width } = useWindowDimensions();
  const series = providedSeries ?? seriesOptions.find((item) => item.id === seriesId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userStrokes, setUserStrokes] = useState<StrokePoint[][]>([]);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(initialCanvasSize);
  const [completed, setCompleted] = useState(false);
  const [helpGuideVisible, setHelpGuideVisible] = useState(false);
  const [showSingraSolution, setShowSingraSolution] = useState(false);
  const [solutionKana, setSolutionKana] = useState('');
  const [pendingNextIndex, setPendingNextIndex] = useState<number | undefined>();
  const [results, setResults] = useState<WritingPracticeResult[]>([]);
  const [feedback, setFeedback] = useState<RelaxedWritingEvaluation | undefined>();
  const [practiceCharacters, setPracticeCharacters] = useState<KanaSeries['characters']>(() =>
    series ? shuffleCharacters(series.characters) : [],
  );
  const [currentExample, setCurrentExample] = useState<VocabularyItem | undefined>();
  const [writingTemplate, setWritingTemplate] = useState<WritingTemplate | undefined>();
  const [failedRemoteExampleImageKeys, setFailedRemoteExampleImageKeys] = useState<Record<string, true>>({});
  const practiceWidth = Math.min(width - screenPadding * 2, maxPracticeWidth);
  const canvasMaxSize = getCanvasMaxSize(width, height, practiceWidth);
  const reviewWidth = Math.min(width - screenPadding * 2, maxReviewWidth);
  const isCompactReview = width < 720 || height < 780;
  const reviewMainWidth = reviewWidth;
  const selectedSeries = series;
  const currentCharacter = practiceCharacters[currentIndex];
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const solutionTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    setShowSingraSolution(false);
    setSolutionKana('');
    setPendingNextIndex(undefined);
    setResults([]);
  }, [selectedSeries]);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentCharacterData() {
      if (!currentCharacter) {
        setCurrentExample(undefined);
        setWritingTemplate(undefined);
        return;
      }

      const [examples, template] = await Promise.all([
        loadVocabularyByKana(currentCharacter.kana),
        loadWritingTemplate(currentCharacter.kana),
      ]);

      if (isMounted) {
        setCurrentExample(examples[0]);
        setWritingTemplate(template);
      }
    }

    loadCurrentCharacterData();

    return () => {
      isMounted = false;
    };
  }, [currentCharacter, loadVocabularyByKana, loadWritingTemplate]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      if (solutionTimeoutRef.current) {
        clearTimeout(solutionTimeoutRef.current);
      }
    };
  }, []);

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
  const exampleImage = resolveVocabularyExampleImage(
    currentExample?.images[0],
    getRemoteImageUrl,
    failedRemoteExampleImageKeys,
  );
  const mascotImage = undefined;
  const reviewMascotImage = getMascotImage('singraSearch');
  const solutionPanelImage = getMascotImage('singraPanel');
  const feedbackMascotImage = getMascotImage('singraGambate') ?? reviewMascotImage;
  const nextSeries = getNextSeriesForReview(activeSeries, seriesOptions);
  const nextSeriesLabel = getReviewSeriesLabel(nextSeries, language);
  const activeSeriesLabel = getReviewSeriesLabel(activeSeries, language);

  function clearDrawing() {
    setUserStrokes([]);
  }

  function goToNextCharacter() {
    if (!hasUserStrokes || feedback) {
      return;
    }

    const evaluation = evaluateRelaxedWriting({
      canvasSize,
      kana: activeCharacter.kana,
      strokes: userStrokes,
      template: writingTemplate,
    });
    const nextResult = createPracticeResult(evaluation);
    const nextResults = [...results];
    nextResults[currentIndex] = nextResult;
    setResults(nextResults);
    setFeedback(evaluation);

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(undefined);

      const nextIndex = currentIndex + 1;
      if (!isTraceMode) {
        if (solutionTimeoutRef.current) {
          clearTimeout(solutionTimeoutRef.current);
        }

        setSolutionKana(activeCharacter.kana);
        setPendingNextIndex(nextIndex < practiceCharacters.length ? nextIndex : undefined);
        setShowSingraSolution(true);
        setHelpGuideVisible(false);
        solutionTimeoutRef.current = setTimeout(() => {
          setShowSingraSolution(false);

          if (nextIndex >= practiceCharacters.length) {
            setCompleted(true);
            return;
          }

          setCurrentIndex(nextIndex);
          setUserStrokes(nextResults[nextIndex]?.userStrokes ?? []);
          setPendingNextIndex(undefined);
        }, 3000);
        return;
      }

      if (nextIndex >= practiceCharacters.length) {
        setCompleted(true);
        setHelpGuideVisible(false);
        return;
      }

      setCurrentIndex(nextIndex);
      setUserStrokes(nextResults[nextIndex]?.userStrokes ?? []);
      setHelpGuideVisible(false);
    }, 780);
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
    setShowSingraSolution(false);
    setSolutionKana('');
    setPendingNextIndex(undefined);
    setResults([]);
  }

  function handleChangeStrokes(nextStrokes: StrokePoint[][]) {
    setUserStrokes(nextStrokes);
  }

  function markRemoteExampleImageFailed(imageKey?: string) {
    if (!imageKey) {
      return;
    }

    setFailedRemoteExampleImageKeys((currentFailedKeys) => ({
      ...currentFailedKeys,
      [imageKey]: true,
    }));
  }

  function commitCurrentResult() {
    const evaluation = evaluateRelaxedWriting({
      canvasSize,
      kana: activeCharacter.kana,
      strokes: userStrokes,
      template: writingTemplate,
    });
    const nextResult = createPracticeResult(evaluation);
    setResults((currentResults) => {
      const nextResults = [...currentResults];
      nextResults[currentIndex] = nextResult;
      return nextResults;
    });
  }

  function createPracticeResult(evaluation?: RelaxedWritingEvaluation): WritingPracticeResult {
    return {
      exampleImageKey: getVocabularyImageKey(currentExample?.images[0]),
      exampleImageUrl: getVocabularyRemoteImageUrl(currentExample?.images[0], getRemoteImageUrl),
      feedbackCategory: evaluation?.category,
      feedbackLabel: evaluation?.message,
      kana: activeCharacter.kana,
      romaji: activeCharacter.romaji,
      score: evaluation?.score,
      userStrokes,
    };
  }

  if (showSingraSolution) {
    const nextKana =
      pendingNextIndex === undefined ? undefined : practiceCharacters[pendingNextIndex]?.kana;

    return (
      <AppScreen background={<KawaiiBackground kana={['OK', solutionKana, nextKana ?? 'END']} />}>
        <View style={[styles.solutionContent, { width: practiceWidth }]}>
          <View style={styles.solutionCopy}>
            <Text style={styles.solutionTitle}>
              {language === 'es' ? 'La respuesta correcta' : 'Correct answer'}
            </Text>
            <Text style={styles.solutionSubtitle}>
              {language === 'es' ? 'Singra te la enseña' : 'Singra shows you'}
            </Text>
          </View>

          <View style={styles.solutionImageWrap}>
            {solutionPanelImage ? (
              <Image resizeMode="contain" source={solutionPanelImage} style={styles.solutionImage} />
            ) : null}
            <View style={styles.solutionBoardTextWrap}>
              <Text style={styles.solutionKana}>{solutionKana}</Text>
            </View>
          </View>
        </View>
      </AppScreen>
    );
  }

  if (completed) {
    return (
      <AppScreen
        background={<KawaiiBackground kana={['review', 'OK', 'kana']} />}
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
              getRemoteImageUrl={getRemoteImageUrl}
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
      background={<KawaiiBackground kana={['write', activeCharacter.kana, 'kana']} />}
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
          onExampleImageError={() => markRemoteExampleImageFailed(getVocabularyImageKey(currentExample?.images[0]))}
          showKanaInfo={isTraceMode}
        />

        <StrokeOrderHint compact={height < 760} template={writingTemplate} />

        <View style={styles.canvasArea}>
          <DrawingCanvas
            guideCharacter={activeCharacter.kana}
            maxSize={canvasMaxSize}
            showGuide={shouldShowGuide}
            strokes={userStrokes}
            onChangeCanvasSize={setCanvasSize}
            onChangeStrokes={handleChangeStrokes}
          />
        </View>

        {feedback ? (
          <WritingFeedback
            category={feedback.category}
            message={feedback.message}
            mascotImage={feedbackMascotImage}
            singraMessage={feedback.singraMessage}
          />
        ) : null}

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

type StrokeOrderHintProps = {
  compact: boolean;
  template?: WritingTemplate;
};

function StrokeOrderHint({ compact, template }: StrokeOrderHintProps) {
  if (!template) {
    return (
      <View style={[styles.strokeHint, compact ? styles.strokeHintCompact : null]}>
        <Text style={[styles.strokeHintText, compact ? styles.strokeHintTextCompact : null]}>
          Traza el kana
        </Text>
      </View>
    );
  }


  return (
    <View style={[styles.strokeHint, compact ? styles.strokeHintCompact : null]}>
      <Text style={[styles.strokeHintText, compact ? styles.strokeHintTextCompact : null]}>
        Orden
      </Text>
      <View style={styles.strokeDots}>
        {template.strokes.map((stroke) => (
          <View key={`${template.kana}-stroke-${stroke.order}`} style={styles.strokeDot}>
            <Text style={styles.strokeDotText}>{stroke.order}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type WritingFeedbackProps = {
  category: RelaxedWritingEvaluation['category'];
  mascotImage?: ImageSourcePropType;
  message: string;
  singraMessage: string;
};

function WritingFeedback({ category, mascotImage, message, singraMessage }: WritingFeedbackProps) {
  return (
    <View style={[styles.feedbackCard, styles[`feedbackCard_${category}`]]}>
      <View style={styles.feedbackParticles}>
        <Text style={styles.feedbackParticle}>*</Text>
        <Text style={styles.feedbackParticle}>sakura</Text>
        <Text style={styles.feedbackParticle}>*</Text>
      </View>
      {mascotImage ? (
        <Image resizeMode="contain" source={mascotImage} style={styles.feedbackMascot} />
      ) : null}
      <View style={styles.feedbackCopy}>
        <Text style={styles.feedbackMessage}>{getFeedbackDisplay(message, category)}</Text>
        <Text style={styles.feedbackSingra}>{singraMessage}</Text>
      </View>
    </View>
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
        <Text style={styles.reviewSparkle}>*</Text>
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
    gap: 10,
    position: 'relative',
    zIndex: 1,
  },
  topBar: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
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
  solutionContent: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: 18,
    justifyContent: 'center',
  },
  solutionCopy: {
    alignItems: 'center',
    gap: 4,
  },
  solutionTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  solutionSubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  solutionImageWrap: {
    aspectRatio: 1,
    maxWidth: 360,
    position: 'relative',
    width: '82%',
  },
  solutionImage: {
    height: '100%',
    width: '100%',
  },
  solutionBoardTextWrap: {
    alignItems: 'center',
    height: '23%',
    justifyContent: 'center',
    left: '30%',
    position: 'absolute',
    top: '58%',
    width: '49%',
  },
  solutionKana: {
    color: colors.ink,
    fontSize: 70,
    fontWeight: '900',
    lineHeight: 82,
    textAlign: 'center',
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
  strokeHint: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.76)',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  strokeHintCompact: {
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  strokeHintText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
  },
  strokeHintTextCompact: {
    fontSize: 11,
  },
  strokeDots: {
    flexDirection: 'row',
    gap: 5,
  },
  strokeDot: {
    alignItems: 'center',
    backgroundColor: '#F8ECEA',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  strokeDotText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  feedbackCard: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 22,
    borderWidth: 1,
    bottom: 18,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  feedbackCard_perfect: {
    backgroundColor: '#EEF6EF',
  },
  feedbackCard_great: {
    backgroundColor: '#FFF7DB',
  },
  feedbackCard_good: {
    backgroundColor: '#F8ECEA',
  },
  feedbackCard_almost: {
    backgroundColor: '#EEF4F8',
  },
  feedbackParticles: {
    alignItems: 'center',
    gap: 1,
  },
  feedbackParticle: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    opacity: 0.72,
  },
  feedbackMascot: {
    height: 54,
    width: 54,
  },
  feedbackCopy: {
    gap: 1,
  },
  feedbackMessage: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  feedbackSingra: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  actions: {
    alignItems: 'center',
    alignSelf: 'center',
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

function getNextSeriesForReview(currentSeries: KanaSeries, seriesOptions: KanaSeries[]) {
  if (currentSeries.id === 'random') {
    return currentSeries;
  }

  const currentIndex = seriesOptions.findIndex((item) => item.id === currentSeries.id);

  if (currentIndex === -1) {
    return seriesOptions[0] ?? currentSeries;
  }

  return seriesOptions[(currentIndex + 1) % seriesOptions.length] ?? currentSeries;
}

function getReviewSeriesLabel(series: KanaSeries, language: 'en' | 'es') {
  if (series.id === 'random') {
    return language === 'es' ? 'random' : 'random';
  }

  if (getSeriesBaseId(series.id) === 'vowels') {
    return language === 'es' ? 'Vocales' : 'Vowels';
  }

  return series.title.replace(/ Series$/u, '');
}

function getSeriesBaseId(seriesId: string) {
  return seriesId.replace(/^(hiragana|katakana|kanji)-/u, '');
}

function getFeedbackDisplay(
  message: string,
  category: RelaxedWritingEvaluation['category'],
) {
  const marks: Record<RelaxedWritingEvaluation['category'], string> = {
    almost: '',
    good: '',
    great: '',
    perfect: '',
  };

  return `${message} ${marks[category]}`;
}

function resolveVocabularyExampleImage(
  image: VocabularyImage | undefined,
  getRemoteImageUrl: (fileName: string) => string | undefined,
  failedRemoteImageKeys: Record<string, true>,
): ImageSourcePropType | undefined {
  const imageKey = getVocabularyImageKey(image);

  if (!image || !imageKey) {
    return undefined;
  }

  const remoteUrl = failedRemoteImageKeys[imageKey]
    ? undefined
    : getVocabularyRemoteImageUrl(image, getRemoteImageUrl);

  return remoteUrl ? { uri: remoteUrl } : getVocabularyImage(imageKey);
}

function getVocabularyRemoteImageUrl(
  image: VocabularyImage | undefined,
  getRemoteImageUrl: (fileName: string) => string | undefined,
) {
  if (!image) {
    return undefined;
  }

  if (image.imageUrl) {
    return image.imageUrl;
  }

  const fileName = getVocabularyImageFileName(image.imagePath ?? image.localAssetKey);

  return fileName ? getRemoteImageUrl(fileName) : undefined;
}

function getVocabularyImageKey(image: VocabularyImage | undefined) {
  if (image?.localAssetKey) {
    return image.localAssetKey;
  }

  const fileName = getVocabularyImageFileName(image?.imagePath);

  return fileName?.replace(/\.webp$/u, '');
}

function getVocabularyImageFileName(imageKeyOrPath?: string) {
  if (!imageKeyOrPath) {
    return undefined;
  }

  const normalizedPath = imageKeyOrPath.replaceAll('\\', '/');
  const fileName = normalizedPath.split('/').filter(Boolean).pop() ?? imageKeyOrPath;

  return fileName.includes('.') ? fileName : `${fileName}.webp`;
}

function getCanvasMaxSize(width: number, height: number, practiceWidth: number) {
  const widthLimit = Math.min(practiceWidth, 460);

  if (width >= 900) {
    if (height < 780) {
      return Math.min(widthLimit, 320);
    }

    if (height < 940) {
      return Math.min(widthLimit, 380);
    }

    return Math.min(widthLimit, 430);
  }

  if (height < 760) {
    return Math.min(widthLimit, 330);
  }

  return widthLimit;
}
