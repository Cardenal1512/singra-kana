import { useEffect, useRef, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';

import {
  evaluateRelaxedWriting,
  type RelaxedWritingEvaluation,
} from '@/src/features/hiragana/application/useCases/evaluateRelaxedWriting';
import type { HandwritingEvaluationResult } from '@/src/features/hiragana/domain/models/HandwritingEvaluation';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { MemoryHandwritingCollage } from '@/src/features/hiragana/domain/models/MemoryHandwritingCollage';
import type { MemoryHandwritingDrawing } from '@/src/features/hiragana/domain/models/MemoryHandwritingDrawing';
import type { MemoryPracticeVariant } from '@/src/features/hiragana/domain/models/MemoryPracticeVariant';
import type {
  PracticeSessionInput,
  PracticeSessionRecordResult,
} from '@/src/features/hiragana/domain/models/PracticeSession';
import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';
import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { VocabularyImage } from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { WritingTemplate } from '@/src/features/hiragana/domain/models/WritingTemplate';
import type {
  ManualWritingReview,
  WritingPracticeResult,
} from '@/src/features/hiragana/domain/models/WritingPracticeResult';
import {
  DrawingCanvas,
  type CanvasSize,
} from '@/src/features/hiragana/presentation/components/DrawingCanvas';
import { KanaPracticeHeader } from '@/src/features/hiragana/presentation/components/KanaPracticeHeader';
import { MemoryHandwritingCollagePreview } from '@/src/features/hiragana/presentation/components/MemoryHandwritingCollagePreview';
import { MemoryHandwritingEvaluationSummary } from '@/src/features/hiragana/presentation/components/MemoryHandwritingEvaluationSummary';
import { ScreenHeader } from '@/src/features/hiragana/presentation/components/ScreenHeader';
import { StrokePreview } from '@/src/features/hiragana/presentation/components/StrokePreview';
import { WritingSequenceReview } from '@/src/features/hiragana/presentation/components/WritingSequenceReview';
import { AnimatedSingra } from '@/src/shared/components/AnimatedSingra';
import { AppScreen } from '@/src/shared/components/AppScreen';
import { CompletionModal } from '@/src/shared/components/CompletionModal';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { PracticeSessionInsightCard } from '@/src/shared/components/PracticeSessionInsightCard';
import { SingraProgressBar } from '@/src/shared/components/SingraProgressBar';
import { getMascotImage, getVocabularyImage } from '@/src/shared/assets/imageRegistry';
import { playSound } from '@/src/shared/audio/AudioService';
import { colors } from '@/src/shared/constants/colors';
import { useTranslation } from '@/src/shared/i18n/useTranslation';
import { FloatingView } from '@/src/shared/motion/FloatingView';

type KanaWritingPracticeScreenProps = {
  evaluateMemoryHandwriting: (
    drawings: MemoryHandwritingDrawing[],
    seriesId: string,
    collageImageUri?: string,
    collageImageBase64?: string,
    collageImageMimeType?: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | 'image/svg+xml',
    collageCanvasSize?: { height: number; width: number },
    collageStrokeWidth?: number,
  ) => Promise<HandwritingEvaluationResult | undefined>;
  generateMemoryHandwritingCollage: (
    drawings: MemoryHandwritingDrawing[],
  ) => Promise<MemoryHandwritingCollage | undefined>;
  getRemoteImageUrl: (fileName: string) => string | undefined;
  loadWritingTemplate: (kana: string) => Promise<WritingTemplate | undefined>;
  loadVocabularyByKana: (kana: string) => Promise<VocabularyItem[]>;
  recordPracticeSession?: (
    input: Omit<PracticeSessionInput, 'userId'>,
  ) => Promise<PracticeSessionRecordResult>;
  memoryPracticeVariant?: MemoryPracticeVariant;
  series?: KanaSeries;
  seriesOptions: KanaSeries[];
  seriesId: string;
  mode: Extract<PracticeMode, 'trace' | 'memory'>;
  showBackButton?: boolean;
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
  evaluateMemoryHandwriting,
  generateMemoryHandwritingCollage,
  getRemoteImageUrl,
  loadWritingTemplate,
  loadVocabularyByKana,
  recordPracticeSession,
  memoryPracticeVariant = 'without-ai',
  series: providedSeries,
  seriesOptions,
  seriesId,
  mode,
  showBackButton = true,
  onBack,
  onNextSeries,
  onRepeatSeries,
}: KanaWritingPracticeScreenProps) {
  const { language, t } = useTranslation();
  const { height, width } = useWindowDimensions();
  const series = providedSeries ?? seriesOptions.find((item) => item.id === seriesId);
  const hasRecordedSessionRef = useRef(false);
  const sessionStartedAtRef = useRef(new Date().toISOString());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userStrokes, setUserStrokes] = useState<StrokePoint[][]>([]);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(initialCanvasSize);
  const [completed, setCompleted] = useState(false);
  const [handwritingEvaluation, setHandwritingEvaluation] = useState<HandwritingEvaluationResult | undefined>();
  const [isEvaluatingHandwriting, setIsEvaluatingHandwriting] = useState(false);
  const [handwritingEvaluationError, setHandwritingEvaluationError] = useState<string | undefined>();
  const [memoryCollage, setMemoryCollage] = useState<MemoryHandwritingCollage | undefined>();
  const [helpGuideVisible, setHelpGuideVisible] = useState(false);
  const [showSingraSolution, setShowSingraSolution] = useState(false);
  const [solutionKana, setSolutionKana] = useState('');
  const [solutionExampleText, setSolutionExampleText] = useState<string | undefined>();
  const [results, setResults] = useState<WritingPracticeResult[]>([]);
  const [manualReviews, setManualReviews] = useState<Record<number, ManualWritingReview | undefined>>({});
  const [manualReviewComments, setManualReviewComments] = useState<Record<number, string | undefined>>({});
  const [manualReviewCommentVisible, setManualReviewCommentVisible] = useState<Record<number, boolean | undefined>>({});
  const [manualReviewOpen, setManualReviewOpen] = useState(false);
  const [manualReviewSubmitted, setManualReviewSubmitted] = useState(false);
  const [memoryDrawings, setMemoryDrawings] = useState<MemoryHandwritingDrawing[]>([]);
  const [feedback, setFeedback] = useState<RelaxedWritingEvaluation | undefined>();
  const [practiceCharacters, setPracticeCharacters] = useState<KanaSeries['characters']>(() =>
    series ? shuffleCharacters(series.characters) : [],
  );
  const [currentExample, setCurrentExample] = useState<VocabularyItem | undefined>();
  const [writingTemplate, setWritingTemplate] = useState<WritingTemplate | undefined>();
  const [failedRemoteExampleImageKeys, setFailedRemoteExampleImageKeys] = useState<Record<string, true>>({});
  const practiceWidth = Math.min(width - screenPadding * 2, maxPracticeWidth);
  const canvasMaxSize = getCanvasMaxSize(width, height, practiceWidth);
  const activeCanvasSide = canvasSize.width > 1 ? canvasSize.width : Math.min(practiceWidth, canvasMaxSize);
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
    setSolutionExampleText(undefined);
    setResults([]);
    setManualReviews({});
    setManualReviewComments({});
    setManualReviewCommentVisible({});
    setManualReviewOpen(false);
    setManualReviewSubmitted(false);
    setMemoryDrawings([]);
    setHandwritingEvaluation(undefined);
    setIsEvaluatingHandwriting(false);
    setHandwritingEvaluationError(undefined);
    setMemoryCollage(undefined);
    hasRecordedSessionRef.current = false;
    sessionStartedAtRef.current = new Date().toISOString();
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

  useEffect(() => {
    if (!completed || hasRecordedSessionRef.current || results.length === 0 || !recordPracticeSession || !selectedSeries) {
      return;
    }

    const completedResults = results.filter((result) => Boolean(result?.kana));
    const shouldUseManualReview = mode === 'memory';
    const hasCompletedManualReview = !shouldUseManualReview
      || completedResults.every((_, index) => Boolean(manualReviews[index]));

    if (!hasCompletedManualReview || (shouldUseManualReview && !manualReviewSubmitted)) {
      return;
    }

    hasRecordedSessionRef.current = true;
    const completedAt = new Date().toISOString();
    const attempts = completedResults.map((result, index) => applyManualReview(result, manualReviews[index]));
    const correctAttempts = attempts.filter((result) => isWritingResultCorrect(result)).length;
    const scores = attempts.map((result) => result.score).filter((score) => typeof score === 'number');

    void recordPracticeSession({
      attempts: attempts.map((result, index) => ({
        targetType: 'kana',
        targetId: `${selectedSeries.id}-${result.kana}`,
        kana: result.kana,
        romaji: result.romaji,
        expectedAnswer: result.kana,
        userAnswer: result.skipped ? '' : result.kana,
        isCorrect: isWritingResultCorrect(result),
        score: result.score,
        order: index,
        metadata: {
          canvasHeight: canvasSize.height,
          canvasWidth: canvasSize.width,
          exampleImageKey: result.exampleImageKey,
          feedbackCategory: result.feedbackCategory,
          feedbackLabel: result.feedbackLabel,
          manualReview: result.manualReview,
          manualReviewComment: manualReviewComments[index]?.trim() || undefined,
          skipped: result.skipped === true,
          strokeCount: result.userStrokes.reduce((total, stroke) => total + stroke.length, 0),
          strokeGroups: result.userStrokes.length,
        },
      })),
      averageScore: scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : undefined,
      completedAt,
      correctAttempts,
      durationSeconds: getDurationSeconds(sessionStartedAtRef.current, completedAt),
      metadata: {
        language,
        memoryPracticeVariant,
        source: 'kana-writing-practice-screen',
      },
      practiceMode: mode === 'memory' ? 'writing-memory' : 'writing-trace',
      seriesId: selectedSeries.id,
      seriesTitle: selectedSeries.title,
      startedAt: sessionStartedAtRef.current,
      syllabary: 'hiragana',
      totalAttempts: attempts.length,
      wrongAttempts: attempts.length - correctAttempts,
    });
  }, [
    canvasSize.height,
    canvasSize.width,
    completed,
    language,
    manualReviewComments,
    memoryPracticeVariant,
    mode,
    manualReviews,
    manualReviewSubmitted,
    recordPracticeSession,
    results,
    selectedSeries,
  ]);

  useEffect(() => {
    if (!completed || mode !== 'memory' || results.length === 0 || manualReviewSubmitted) {
      return;
    }

    const completedResults = results.filter((result) => Boolean(result?.kana));
    const missingDefaultReview = completedResults.some((_, index) => !manualReviews[index]);

    if (!missingDefaultReview) {
      return;
    }

    setManualReviews(
      completedResults.reduce<Record<number, ManualWritingReview>>((nextReviews, result, index) => {
        if (result?.kana) {
          nextReviews[index] = manualReviews[index] ?? 'correct';
        }

        return nextReviews;
      }, {}),
    );
  }, [completed, manualReviews, manualReviewSubmitted, mode, results]);

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
  const shouldUseAiEvaluation = mode === 'memory' && memoryPracticeVariant === 'with-ai';
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
    const nextMemoryDrawings = saveMemoryDrawing(memoryDrawings);
    setResults(nextResults);
    setMemoryDrawings(nextMemoryDrawings);
    const nextIndex = currentIndex + 1;

    if (!isTraceMode) {
      continueAfterMemoryStep(nextIndex, nextResults, nextMemoryDrawings);
      return;
    }

    setFeedback(evaluation);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(undefined);

      if (nextIndex >= practiceCharacters.length) {
        finishPractice(nextMemoryDrawings);
        return;
      }

      setCurrentIndex(nextIndex);
      setUserStrokes(nextResults[nextIndex]?.userStrokes ?? []);
      setHelpGuideVisible(false);
    }, 780);
  }

  function handleDontKnow() {
    if (isTraceMode || feedback || showSingraSolution) {
      return;
    }

    const nextResult = createPracticeResult({
      category: 'almost',
      message: language === 'es' ? 'No lo sé' : "I don't know",
      score: 0,
      singraMessage: language === 'es' ? 'Miremos la respuesta' : "Let's check it",
    }, true);
    const nextResults = [...results];
    nextResults[currentIndex] = nextResult;
    const nextMemoryDrawings = saveMemoryDrawing(memoryDrawings);
    const nextIndex = currentIndex + 1;

    setResults(nextResults);
    setMemoryDrawings(nextMemoryDrawings);
    showMemorySolutionAndContinue(nextIndex, nextResults, nextMemoryDrawings);
  }

  function handleManualHelp() {
    if (isTraceMode || feedback || showSingraSolution) {
      return;
    }

    showMemorySolutionHint();
  }

  function continueAfterMemoryStep(
    nextIndex: number,
    nextResults: WritingPracticeResult[],
    nextMemoryDrawings: MemoryHandwritingDrawing[],
  ) {
    setShowSingraSolution(false);
    setSolutionExampleText(undefined);

    if (nextIndex >= practiceCharacters.length) {
      finishPractice(nextMemoryDrawings);
      return;
    }

    setCurrentIndex(nextIndex);
    setUserStrokes(nextResults[nextIndex]?.userStrokes ?? []);
    setHelpGuideVisible(false);
  }

  function showMemorySolutionHint() {
    if (solutionTimeoutRef.current) {
      clearTimeout(solutionTimeoutRef.current);
    }

    setSolutionKana(activeCharacter.kana);
    setSolutionExampleText(getVocabularyExampleDisplay(currentExample, language));
    setShowSingraSolution(true);
    setHelpGuideVisible(true);
    solutionTimeoutRef.current = setTimeout(() => {
      setShowSingraSolution(false);
      setSolutionExampleText(undefined);
      setHelpGuideVisible(false);
    }, 2600);
  }

  function showMemorySolutionAndContinue(
    nextIndex: number,
    nextResults: WritingPracticeResult[],
    nextMemoryDrawings: MemoryHandwritingDrawing[],
  ) {
    if (solutionTimeoutRef.current) {
      clearTimeout(solutionTimeoutRef.current);
    }

    setSolutionKana(activeCharacter.kana);
    setSolutionExampleText(getVocabularyExampleDisplay(currentExample, language));
    setShowSingraSolution(true);
    setHelpGuideVisible(false);
    solutionTimeoutRef.current = setTimeout(() => {
      setShowSingraSolution(false);
      setSolutionExampleText(undefined);
      continueAfterMemoryStep(nextIndex, nextResults, nextMemoryDrawings);
    }, 2600);
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
    setSolutionExampleText(undefined);
    setResults([]);
    setManualReviews({});
    setManualReviewComments({});
    setManualReviewCommentVisible({});
    setManualReviewOpen(false);
    setManualReviewSubmitted(false);
    setMemoryDrawings([]);
    setHandwritingEvaluation(undefined);
    setIsEvaluatingHandwriting(false);
    setHandwritingEvaluationError(undefined);
    setMemoryCollage(undefined);
    hasRecordedSessionRef.current = false;
    sessionStartedAtRef.current = new Date().toISOString();
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

  function handleManualReviewChange(index: number, review: ManualWritingReview) {
    setManualReviews((currentReviews) => ({
      ...currentReviews,
      [index]: review,
    }));
  }

  function handleManualReviewCommentChange(index: number, comment: string) {
    setManualReviewComments((currentComments) => ({
      ...currentComments,
      [index]: comment,
    }));
  }

  function handleToggleManualReviewComment(index: number) {
    setManualReviewCommentVisible((currentVisible) => ({
      ...currentVisible,
      [index]: !currentVisible[index],
    }));
  }

  function handleSelectAllManualReviews() {
    setManualReviews(
      results.reduce<Record<number, ManualWritingReview>>((nextReviews, result, index) => {
        if (result?.kana) {
          nextReviews[index] = 'correct';
        }

        return nextReviews;
      }, {}),
    );
  }

  function handleSubmitManualReview() {
    const completedResults = results.filter((result) => Boolean(result?.kana));
    const complete = completedResults.every((_, index) => Boolean(manualReviews[index]));

    if (!complete) {
      playSound('error');
      return;
    }

    playSound('success');
    setManualReviewSubmitted(true);
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
    setMemoryDrawings((currentDrawings) => saveMemoryDrawing(currentDrawings));
  }

  function createPracticeResult(
    evaluation?: RelaxedWritingEvaluation,
    skipped = false,
  ): WritingPracticeResult {
    return {
      exampleImageKey: getVocabularyImageKey(currentExample?.images[0]),
      exampleImageUrl: getVocabularyRemoteImageUrl(currentExample?.images[0], getRemoteImageUrl),
      feedbackCategory: evaluation?.category,
      feedbackLabel: evaluation?.message,
      kana: activeCharacter.kana,
      romaji: activeCharacter.romaji,
      score: evaluation?.score,
      skipped,
      userStrokes,
    };
  }

  function saveMemoryDrawing(currentDrawings: MemoryHandwritingDrawing[]) {
    if (mode !== 'memory') {
      return currentDrawings;
    }

    const nextDrawings = [...currentDrawings];
    nextDrawings[currentIndex] = createMemoryDrawing();
    return nextDrawings;
  }

  function createMemoryDrawing(): MemoryHandwritingDrawing {
    return {
      id: `${activeSeries.id}-${currentIndex}-${activeCharacter.kana}`,
      order: currentIndex,
      expectedKana: activeCharacter.kana,
      romaji: activeCharacter.romaji,
      strokes: userStrokes,
      canvasSize,
    };
  }

  function finishPractice(finalDrawings: MemoryHandwritingDrawing[]) {
    setCompleted(true);
    setHelpGuideVisible(false);

    console.log('[MEMORY_EVALUATION] Selected mode', {
      memoryPracticeVariant,
      mode,
      shouldUseAiEvaluation,
    });

    if (!shouldUseAiEvaluation) {
      return;
    }

    setHandwritingEvaluation(undefined);
    setIsEvaluatingHandwriting(true);
    setHandwritingEvaluationError(undefined);
    setMemoryCollage(undefined);
    generateMemoryHandwritingCollage(finalDrawings)
      .then((collage) => {
        setMemoryCollage(collage);

        if (collage) {
          console.log('[MemoryHandwritingCollage]', {
            height: collage.height,
            imageBase64Length: collage.imageBase64.length,
            layout: collage.layout,
            localUriScheme: collage.localUri.split(':')[0],
            mimeType: collage.mimeType,
            strokeWidth: collage.strokeWidth,
            width: collage.width,
          });
        }

        return evaluateMemoryHandwriting(
          finalDrawings,
          activeSeries.id,
          collage?.localUri,
          collage?.imageBase64,
          collage?.mimeType,
          collage ? { height: collage.height, width: collage.width } : undefined,
          collage?.strokeWidth,
        );
      })
      .then((evaluation) => {
        setHandwritingEvaluation(evaluation);
        if (evaluation?.source === 'fallback') {
          setHandwritingEvaluationError(
            language === 'es'
              ? 'AI failed, fallback used'
              : 'AI failed, fallback used',
          );
        }
      })
      .catch(() => {
        setHandwritingEvaluation(undefined);
        setHandwritingEvaluationError(
          language === 'es'
            ? 'Singra no pudo revisar tu escritura esta vez, pero tu práctica se ha guardado.'
            : 'Singra could not review your writing this time, but your practice was saved.',
        );
      })
      .finally(() => {
        setIsEvaluatingHandwriting(false);
      });
  }

  if (completed) {
    const completedResults = results.filter((result) => Boolean(result?.kana));
    const reviewedResults = completedResults.map((result, index) =>
      applyManualReview(result, manualReviews[index]),
    );
    const correctResultCount = reviewedResults.filter(isWritingResultCorrect).length;
    const failedKana = reviewedResults
      .filter((result) => !isWritingResultCorrect(result))
      .map((result) => result.kana);
    const isManualReviewComplete = mode !== 'memory'
      || completedResults.every((_, index) => Boolean(manualReviews[index]));

    if (mode === 'memory' && manualReviewSubmitted) {
      const durationSeconds = getDurationSeconds(sessionStartedAtRef.current, new Date().toISOString());

      return (
        <AppScreen background={<KawaiiBackground kana={['review', 'OK', 'kana']} />}>
          <MemoryCompletionSummaryScreen
            correctCount={correctResultCount}
            durationSeconds={durationSeconds}
            failedKana={failedKana}
            isCompact={isCompactReview}
            language={language}
            mascotImage={reviewMascotImage}
            nextSeriesLabel={nextSeriesLabel}
            totalCount={completedResults.length}
            onBack={onBack}
            onNextSeries={onNextSeries}
            onRepeat={activeSeries.id === 'random' ? onRepeatSeries : restartPractice}
          />
        </AppScreen>
      );
    }

    if (mode === 'memory' && !manualReviewSubmitted) {
      return (
        <AppScreen
          background={<KawaiiBackground kana={['review', 'OK', 'kana']} />}
          footer={
            <View style={[styles.reviewFooter, { width: reviewWidth }]}>
              <StepButton
                disabled={!isManualReviewComplete}
                label={language === 'es' ? 'Continuar' : 'Continue'}
                primary
                onPress={handleSubmitManualReview}
              />
            </View>
          }>
          <MemoryManualReviewScreen
            comments={manualReviewComments}
            commentVisible={manualReviewCommentVisible}
            getRemoteImageUrl={getRemoteImageUrl}
            language={language}
            manualReviewOpen={manualReviewOpen}
            manualReviews={manualReviews}
            results={completedResults}
            reviewWidth={reviewWidth}
            sourceCanvasSize={canvasSize}
            onChangeComment={handleManualReviewCommentChange}
            onSelectAll={handleSelectAllManualReviews}
            onToggleComment={handleToggleManualReviewComment}
            onToggleReviewOpen={() => setManualReviewOpen((open) => !open)}
            onUpdateReview={handleManualReviewChange}
          />
        </AppScreen>
      );
    }

    return (
      <AppScreen
        background={<KawaiiBackground kana={['review', 'OK', 'kana']} />}
        header={
          <View style={[styles.reviewHeader, { width: reviewWidth }]}>
            {showBackButton ? <WritingBackButton label={t.common.back} onPress={onBack} /> : null}
          </View>
        }
        footer={
          <View style={[styles.reviewFooter, { width: reviewWidth }]}>
            <CompletionModal
              compact={isCompactReview}
              heroImageSource={reviewMascotImage}
              insight={
                <PracticeSessionInsightCard
                  correctCount={correctResultCount}
                  durationSeconds={getDurationSeconds(sessionStartedAtRef.current, new Date().toISOString())}
                  failedKana={failedKana}
                  language={language}
                  totalCount={completedResults.length}
                />
              }
              nextLabel={
                language === 'es'
                  ? `Siguiente: ${nextSeriesLabel}`
                  : `Next: ${nextSeriesLabel}`
              }
                onChangeMode={onBack}
                onNext={onNextSeries}
                onRepeat={activeSeries.id === 'random' ? onRepeatSeries : restartPractice}
                nextDisabled={!isManualReviewComplete}
                repeatDisabled={!isManualReviewComplete}
                reviewFailuresDisabled
                reviewFailuresLabel={language === 'es' ? 'Repasar fallos' : 'Review misses'}
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
            {shouldUseAiEvaluation ? (
              <View style={styles.memoryReviewStack}>
                <MemoryHandwritingEvaluationSummary
                  errorMessage={handwritingEvaluationError}
                  evaluation={handwritingEvaluation}
                  isLoading={isEvaluatingHandwriting}
                  language={language}
                />
                <MemoryHandwritingCollagePreview
                  availableWidth={reviewMainWidth}
                  collage={memoryCollage}
                  language={language}
                />
              </View>
            ) : (
              <WritingSequenceReview
                availableWidth={reviewMainWidth}
                compact={isCompactReview}
                correctLabel={t.writing.correct}
                getRemoteImageUrl={getRemoteImageUrl}
                results={results}
                sourceCanvasSize={canvasSize}
                title={t.writing.finalReviewTitle}
                yourWritingLabel={t.writing.yourWriting}
                manualReviewLabel={language === 'es' ? 'Validación rápida' : 'Quick check'}
                manualReviewRequiredLabel={language === 'es' ? 'Guarda al completar' : 'Saved when complete'}
                manualReviewValues={mode === 'memory' ? manualReviews : undefined}
                onManualReviewChange={mode === 'memory' ? handleManualReviewChange : undefined}
              />
            )}
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
          {showBackButton ? <WritingBackButton label={t.common.back} onPress={onBack} /> : <View />}
          {!isTraceMode ? (
            <HelpButton
              label={t.common.help}
              onShow={handleManualHelp}
              onHide={() => setHelpGuideVisible(false)}
            />
          ) : null}
        </View>
      }
      footer={
        <View style={[styles.actions, { width: practiceWidth }]}>
          <StepButton
            disabled={currentIndex === 0 || showSingraSolution}
            label={language === 'es' ? 'Anterior' : 'Previous'}
            onPress={goToPreviousCharacter}
          />
          {!isTraceMode ? (
            <StepButton
              disabled={showSingraSolution}
              label={language === 'es' ? 'No lo sé' : "I don't know"}
              onPress={handleDontKnow}
            />
          ) : null}
          <ClearIconButton disabled={showSingraSolution} label={t.common.clear} onPress={clearDrawing} />
          <StepButton
            disabled={!hasUserStrokes || showSingraSolution}
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
        <SingraProgressBar
          current={currentIndex + 1}
          label={`${currentIndex + 1} / ${practiceCharacters.length}`}
          total={practiceCharacters.length}
        />

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
          {showSingraSolution ? (
            <MemorySolutionFeedback
              exampleText={solutionExampleText}
              imageSource={solutionPanelImage}
              kana={solutionKana}
              label={language === 'es' ? 'Respuesta correcta' : 'Correct answer'}
              size={activeCanvasSide}
            />
          ) : null}
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
  const handlePress = () => {
    playSound('tap');
    onPress();
  };

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} style={styles.backButton}>
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
  const handleShow = () => {
    playSound('tap');
    onShow();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onHoverOut={onHide}
      onPressIn={handleShow}
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
  const handlePress = () => {
    playSound('tap');
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
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
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

function ClearIconButton({ disabled = false, label, onPress }: ClearIconButtonProps) {
  const handlePress = () => {
    if (disabled) {
      return;
    }

    playSound('tap');
    onPress();
  };

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.clearIconButton,
        disabled ? styles.stepButtonDisabled : null,
        pressed && !disabled ? styles.stepButtonPressed : null,
      ]}>
      <MaterialIcons name="delete-outline" size={24} color={disabled ? colors.disabledText : colors.primary} />
    </Pressable>
  );
}

type StrokeOrderHintProps = {
  compact: boolean;
  template?: WritingTemplate;
};

type MemoryManualReviewScreenProps = {
  comments: Record<number, string | undefined>;
  commentVisible: Record<number, boolean | undefined>;
  getRemoteImageUrl: (fileName: string) => string | undefined;
  language: 'en' | 'es';
  manualReviewOpen: boolean;
  manualReviews: Record<number, ManualWritingReview | undefined>;
  results: WritingPracticeResult[];
  reviewWidth: number;
  sourceCanvasSize: CanvasSize;
  onChangeComment: (index: number, comment: string) => void;
  onSelectAll: () => void;
  onToggleComment: (index: number) => void;
  onToggleReviewOpen: () => void;
  onUpdateReview: (index: number, review: ManualWritingReview) => void;
};

type MemoryCompletionSummaryScreenProps = {
  correctCount: number;
  durationSeconds: number;
  failedKana: string[];
  isCompact: boolean;
  language: 'en' | 'es';
  mascotImage?: ImageSourcePropType;
  nextSeriesLabel: string;
  totalCount: number;
  onBack: () => void;
  onNextSeries: () => void;
  onRepeat: () => void;
};

function MemoryCompletionSummaryScreen({
  correctCount,
  durationSeconds,
  failedKana,
  isCompact,
  language,
  mascotImage,
  nextSeriesLabel,
  totalCount,
  onBack,
  onNextSeries,
  onRepeat,
}: MemoryCompletionSummaryScreenProps) {
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const hasFailures = failedKana.length > 0;

  return (
    <View style={styles.memorySummaryScreen}>
      <View style={[styles.memorySummaryCard, isCompact ? styles.memorySummaryCardCompact : null]}>
        {mascotImage ? (
          <View style={styles.memorySummaryMascot}>
            <AnimatedSingra mood="happy" size={isCompact ? 58 : 82} source={mascotImage} />
          </View>
        ) : null}
        <View style={styles.memorySummaryCopy}>
          <Text style={styles.memorySummaryTitle}>
            {language === 'es' ? 'Práctica completada' : 'Practice complete'}
          </Text>
          <Text style={styles.memorySummaryScore}>{accuracy}%</Text>
          <Text style={styles.memorySummarySubtitle}>
            {language === 'es'
              ? `${correctCount} de ${totalCount} correctos · ${formatDuration(durationSeconds)}`
              : `${correctCount} of ${totalCount} correct · ${formatDuration(durationSeconds)}`}
          </Text>
          <Text style={styles.memorySummaryAdvice}>
            {hasFailures
              ? language === 'es'
                ? 'Singra guardó tus fallos para futuros repasos.'
                : 'Singra saved your misses for future review.'
              : language === 'es'
                ? 'Buen ritmo. Puedes seguir con la siguiente serie.'
                : 'Nice rhythm. You can move to the next series.'}
          </Text>
        </View>

        <View style={styles.memorySummaryActions}>
          <StepButton
            label={language === 'es' ? `Siguiente: ${nextSeriesLabel}` : `Next: ${nextSeriesLabel}`}
            primary
            onPress={onNextSeries}
          />
          <StepButton
            label={language === 'es' ? 'Repetir esta serie' : 'Repeat this series'}
            onPress={onRepeat}
          />
          <StepButton
            disabled
            label={language === 'es' ? 'Repasar fallos' : 'Review misses'}
            onPress={onRepeat}
          />
          <StepButton
            label={language === 'es' ? 'Cambiar modo' : 'Change mode'}
            onPress={onBack}
          />
        </View>
      </View>
    </View>
  );
}

function MemoryManualReviewScreen({
  comments,
  commentVisible,
  getRemoteImageUrl,
  language,
  manualReviewOpen,
  manualReviews,
  results,
  reviewWidth,
  sourceCanvasSize,
  onChangeComment,
  onSelectAll,
  onToggleComment,
  onToggleReviewOpen,
  onUpdateReview,
}: MemoryManualReviewScreenProps) {
  const reviewedCount = results.filter((_, index) => Boolean(manualReviews[index])).length;

  return (
    <View style={[styles.manualReviewScreen, { width: reviewWidth }]}> 
      <View style={styles.manualReviewHero}>
        <Text style={styles.manualReviewTitle}>
          {language === 'es' ? 'Practica completada' : 'Practice complete'}
        </Text>
        <ScrollView
          horizontal
          contentContainerStyle={[
            styles.manualKanaScroller,
            results.length <= 5 ? styles.manualKanaScrollerCentered : null,
          ]}
          showsHorizontalScrollIndicator={false}>
          {results.map((result, index) => (
            <View key={`done-kana-${result.kana}-${index}`} style={styles.manualKanaPill}>
              <Text style={styles.manualKanaPillText}>{result.kana}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.manualReviewPanel}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            playSound('tap');
            onToggleReviewOpen();
          }}
          style={styles.manualReviewPanelHeader}>
          <View style={styles.manualReviewPanelCopy}>
            <Text style={styles.manualReviewSectionTitle}>
              {language === 'es' ? 'Revision rapida' : 'Quick review'}
            </Text>
            <Text style={styles.manualReviewSubtitle}>
              {language === 'es'
                ? 'Todo esta marcado como correcto. Abre si quieres ajustar.'
                : 'Everything is marked correct. Open to adjust.'}
            </Text>
          </View>
          <Text style={styles.manualReviewChevron}>{manualReviewOpen ? '^' : 'v'}</Text>
        </Pressable>

        <Text style={styles.manualReviewProgress}>
          {reviewedCount} / {results.length}
        </Text>

        {manualReviewOpen ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                playSound('tap');
                onSelectAll();
              }}
              style={({ pressed }) => [
                styles.selectAllButton,
                pressed ? styles.stepButtonPressed : null,
              ]}>
              <Text style={styles.selectAllText}>
                {language === 'es' ? 'Seleccionar todos' : 'Select all'}
              </Text>
            </Pressable>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={80}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                style={styles.manualReviewList}
                contentContainerStyle={styles.manualReviewListContent}
                showsVerticalScrollIndicator={false}>
                {results.map((result, index) => (
                  <MemoryManualReviewRow
                    key={`memory-review-${result.kana}-${index}`}
                    comment={comments[index] ?? ''}
                    commentVisible={commentVisible[index] === true}
                    getRemoteImageUrl={getRemoteImageUrl}
                    index={index}
                    language={language}
                    result={result}
                    review={manualReviews[index]}
                    sourceCanvasSize={sourceCanvasSize}
                    onChangeComment={onChangeComment}
                    onToggleComment={onToggleComment}
                    onUpdateReview={onUpdateReview}
                  />
                ))}
              </ScrollView>
            </KeyboardAvoidingView>
          </>
        ) : null}
      </View>
    </View>
  );
}
function MemoryManualReviewRow({
  comment,
  commentVisible,
  getRemoteImageUrl,
  index,
  language,
  result,
  review,
  sourceCanvasSize,
  onChangeComment,
  onToggleComment,
  onUpdateReview,
}: {
  comment: string;
  commentVisible: boolean;
  getRemoteImageUrl: (fileName: string) => string | undefined;
  index: number;
  language: 'en' | 'es';
  result: WritingPracticeResult;
  review?: ManualWritingReview;
  sourceCanvasSize: CanvasSize;
  onChangeComment: (index: number, comment: string) => void;
  onToggleComment: (index: number) => void;
  onUpdateReview: (index: number, review: ManualWritingReview) => void;
}) {
  const exampleImage = resolveResultExampleImage(result, getRemoteImageUrl);

  return (
    <View style={styles.manualReviewRowWrap}>
      <View style={styles.manualReviewRow}>
        <Text style={styles.manualReviewKana}>{result.kana}</Text>
        <View style={styles.manualReviewTrace}>
          <StrokePreview
            size={48}
            sourceCanvasSize={sourceCanvasSize}
            strokes={result.userStrokes}
            strokeWidth={14}
          />
        </View>
        <View style={styles.manualReviewExample}>
          {exampleImage ? (
            <Image resizeMode="contain" source={exampleImage} style={styles.manualReviewExampleImage} />
          ) : (
            <Text style={styles.manualReviewExampleFallback}>-</Text>
          )}
        </View>
        <View style={styles.manualReviewChoices}>
          {manualReviewOptions.map((option) => (
            <ManualReviewOptionButton
              key={option.value}
              active={review === option.value}
              label={option.label}
              review={option.value}
              onPress={() => onUpdateReview(index, option.value)}
            />
          ))}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          playSound('tap');
          onToggleComment(index);
        }}
        style={styles.commentToggle}>
        <Text style={styles.commentToggleText}>
          {language === 'es' ? 'Comentario (opcional)' : 'Note (optional)'}
        </Text>
      </Pressable>
      {commentVisible ? (
        <TextInput
          multiline
          onChangeText={(nextComment) => onChangeComment(index, nextComment)}
          placeholder={language === 'es' ? 'Nota para este kana...' : 'Note for this kana...'}
          placeholderTextColor={colors.mutedText}
          returnKeyType="done"
          style={styles.commentInput}
          value={comment}
        />
      ) : null}
      </View>
  );
}

const manualReviewOptions: { label: string; value: ManualWritingReview }[] = [
  { label: '👍', value: 'correct' },
  { label: '🤔', value: 'doubtful' },
  { label: '❌', value: 'incorrect' },
];

function ManualReviewOptionButton({
  active,
  label,
  onPress,
  review,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  review: ManualWritingReview;
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
        styles.manualReviewOption,
        active ? styles[`manualReviewOption_${review}`] : null,
        pressed ? styles.stepButtonPressed : null,
      ]}>
      <Text style={styles.manualReviewOptionText}>{label}</Text>
    </Pressable>
  );
}

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
  const mood = category === 'almost' ? 'thinking' : category === 'good' ? 'idle' : 'happy';

  return (
    <View style={[styles.feedbackCard, styles[`feedbackCard_${category}`]]}>
      <View style={styles.feedbackParticles}>
        <Text style={styles.feedbackParticle}>*</Text>
        <Text style={styles.feedbackParticle}>sakura</Text>
        <Text style={styles.feedbackParticle}>*</Text>
      </View>
      {mascotImage ? (
        <AnimatedSingra mood={mood} size={54} source={mascotImage} />
      ) : null}
      <View style={styles.feedbackCopy}>
        <Text style={styles.feedbackMessage}>{getFeedbackDisplay(message, category)}</Text>
        <Text style={styles.feedbackSingra}>{singraMessage}</Text>
      </View>
    </View>
  );
}

type MemorySolutionFeedbackProps = {
  exampleText?: string;
  imageSource?: ImageSourcePropType;
  kana: string;
  label: string;
  size: number;
};

function MemorySolutionFeedback({
  exampleText,
  imageSource,
  kana,
  label,
  size,
}: MemorySolutionFeedbackProps) {
  const imageSize = Math.max(1, Math.round(size * 0.5));
  const kanaFontSize = Math.max(24, Math.round(imageSize * 0.18));

  return (
    <View pointerEvents="none" style={[styles.memorySolutionOverlay, { height: size, width: size }]}>
      <Text style={styles.memorySolutionLabel}>{label}</Text>
      <View style={[styles.memorySolutionImageWrap, { height: imageSize, width: imageSize }]}>
        {imageSource ? (
          <AnimatedSingra mood="happy" size={imageSize} source={imageSource} />
        ) : null}
        <View style={styles.memorySolutionBoardTextWrap}>
          <Text
            style={[
              styles.memorySolutionKana,
              { fontSize: kanaFontSize, lineHeight: Math.round(kanaFontSize * 1.14) },
            ]}>
            {kana}
          </Text>
        </View>
      </View>
      {exampleText ? (
        <Text numberOfLines={2} style={styles.memorySolutionExample}>
          {exampleText}
        </Text>
      ) : null}
      <View style={styles.memorySolutionFooterSpace} />
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
        <AnimatedSingra mood="idle" size={imageSize} source={imageSource} />
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
  memoryReviewStack: {
    gap: 12,
  },
  manualReviewScreen: {
    alignSelf: 'center',
    gap: 12,
  },
  memorySummaryScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  memorySummaryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    maxWidth: 560,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    width: '100%',
    elevation: 2,
  },
  memorySummaryCardCompact: {
    gap: 10,
    padding: 14,
  },
  memorySummaryMascot: {
    alignItems: 'center',
    backgroundColor: '#FFF7DB',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  memorySummaryCopy: {
    alignItems: 'center',
    gap: 5,
  },
  memorySummaryTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  memorySummaryScore: {
    color: colors.primary,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 52,
    textAlign: 'center',
  },
  memorySummarySubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  memorySummaryAdvice: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
  memorySummaryActions: {
    alignSelf: 'stretch',
    gap: 8,
  },
  manualReviewHero: {
    gap: 10,
  },
  manualReviewTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
  },
  manualKanaScroller: {
    gap: 7,
    minWidth: '100%',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  manualKanaScrollerCentered: {
    justifyContent: 'center',
  },
  manualKanaPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    minWidth: 42,
    paddingHorizontal: 10,
  },
  manualKanaPillText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  manualReviewPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 1,
  },
  manualReviewPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  manualReviewPanelCopy: {
    flex: 1,
    gap: 2,
    minWidth: 180,
  },
  manualReviewSectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  manualReviewSubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '800',
  },
  manualReviewChevron: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
    minWidth: 24,
    textAlign: 'center',
  },
  selectAllButton: {
    backgroundColor: '#FFF7DB',
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  manualReviewProgress: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  manualReviewList: {
    maxHeight: 390,
  },
  manualReviewListContent: {
    gap: 7,
    paddingBottom: 2,
  },
  manualReviewRowWrap: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 7,
  },
  manualReviewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 72,
  },
  manualReviewKana: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
    width: 38,
  },
  manualReviewTrace: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  manualReviewExample: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  manualReviewExampleImage: {
    height: '100%',
    width: '100%',
  },
  manualReviewExampleFallback: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: '900',
  },
  manualReviewChoices: {
    flexDirection: 'row',
    gap: 5,
    marginLeft: 'auto',
  },
  manualReviewOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  manualReviewOption_correct: {
    backgroundColor: '#EEF6EF',
    borderColor: '#7BB77D',
  },
  manualReviewOption_doubtful: {
    backgroundColor: '#FFF1CA',
    borderColor: '#E1B955',
  },
  manualReviewOption_incorrect: {
    backgroundColor: '#F8ECEA',
    borderColor: colors.primary,
  },
  manualReviewOptionText: {
    fontSize: 19,
    lineHeight: 23,
    textAlign: 'center',
  },
  commentToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  commentToggleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  commentInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
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
  memorySolutionOverlay: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'absolute',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    top: 0,
    elevation: 3,
  },
  memorySolutionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    textAlign: 'center',
  },
  memorySolutionImageWrap: {
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  memorySolutionBoardTextWrap: {
    alignItems: 'center',
    height: '23%',
    justifyContent: 'center',
    left: '30%',
    position: 'absolute',
    top: '58%',
    width: '49%',
  },
  memorySolutionKana: {
    color: colors.ink,
    fontWeight: '900',
    textAlign: 'center',
  },
  memorySolutionExample: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    maxWidth: '92%',
    textAlign: 'center',
  },
  memorySolutionFooterSpace: {
    minHeight: 12,
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
    position: 'relative',
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

function applyManualReview(
  result: WritingPracticeResult,
  manualReview: ManualWritingReview | undefined,
): WritingPracticeResult {
  if (!manualReview) {
    return result;
  }

  return {
    ...result,
    manualReview,
    score: getManualReviewScore(manualReview),
  };
}

function getManualReviewScore(manualReview: ManualWritingReview) {
  if (manualReview === 'correct') {
    return 100;
  }

  if (manualReview === 'doubtful') {
    return 50;
  }

  return 0;
}

function isWritingResultCorrect(result: WritingPracticeResult) {
  return result.manualReview === 'correct' || (!result.manualReview && (result.score ?? 0) >= 68);
}

function getVocabularyExampleDisplay(
  example: VocabularyItem | undefined,
  language: 'en' | 'es',
) {
  if (!example) {
    return undefined;
  }

  const meaning = language === 'es' ? example.meaningEs : example.meaningEn;
  const word = example.japanese;

  return [word, example.romaji, meaning].filter(Boolean).join(' · ');
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

  const fileName = getVocabularyImageFileName(result.exampleImageKey);
  const remoteUrl = fileName ? getRemoteImageUrl(fileName) : undefined;

  return remoteUrl ? { uri: remoteUrl } : getVocabularyImage(result.exampleImageKey);
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

function getDurationSeconds(startedAt: string, completedAt: string) {
  return Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 1000));
}

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
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
