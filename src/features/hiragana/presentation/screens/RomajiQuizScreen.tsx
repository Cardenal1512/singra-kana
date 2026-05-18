import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { checkRomajiAnswer } from '@/src/features/hiragana/application/useCases/checkRomajiAnswer';
import type { KanaCharacter } from '@/src/features/hiragana/domain/models/KanaCharacter';
import type { KanaExample } from '@/src/features/hiragana/domain/models/KanaExample';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import { hiraganaSeries } from '@/src/features/hiragana/infrastructure/data/hiraganaSeries';
import { kanaExamples } from '@/src/features/hiragana/infrastructure/data/kanaExamples';
import { getVocabularyImage } from '@/src/shared/assets/imageRegistry';
import { AppButton } from '@/src/shared/components/AppButton';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useTranslation } from '@/src/shared/i18n/useTranslation';

type RomajiQuizScreenProps = {
  series?: KanaSeries;
  seriesId: string;
  onBack: () => void;
  onNextSeries: () => void;
  onRepeatSeries: () => void;
};

type QuizAttempt = {
  character: KanaCharacter;
  correctAnswer: string;
  example?: KanaExample;
  imageSource?: ImageSourcePropType;
  isCorrect: boolean;
  userAnswer: string;
};

export function RomajiQuizScreen({
  series: providedSeries,
  seriesId,
  onBack,
  onNextSeries,
  onRepeatSeries,
}: RomajiQuizScreenProps) {
  const { language, t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const series = providedSeries ?? hiraganaSeries.find((item) => item.id === seriesId);
  const initialItems = useMemo(() => series?.characters ?? [], [series]);
  const [quizItems, setQuizItems] = useState<KanaCharacter[]>(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [completed, setCompleted] = useState(false);
  const [resultAttempt, setResultAttempt] = useState<QuizAttempt | undefined>();
  const [correctedAllFailures, setCorrectedAllFailures] = useState(false);

  useEffect(() => {
    setQuizItems(initialItems);
    setCurrentIndex(0);
    setAnswer('');
    setAttempts([]);
    setCompleted(false);
    setResultAttempt(undefined);
    setCorrectedAllFailures(false);
  }, [initialItems]);

  useEffect(() => {
    if (!completed && !resultAttempt) {
      const timer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [completed, currentIndex, resultAttempt]);

  useEffect(() => {
    return () => {
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
      }
    };
  }, []);

  if (!series || quizItems.length === 0) {
    return (
      <View style={styles.root}>
        <KawaiiBackground />
        <View style={styles.quizContainer}>
          <QuizHeader title="Series not found" backLabel={t.common.back} onBack={onBack} />
        </View>
      </View>
    );
  }

  const activeSeries = series;
  const currentCharacter = quizItems[currentIndex];
  const failures = attempts.filter((attempt) => !attempt.isCorrect);
  const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;

  function checkAnswer() {
    if (resultAttempt) {
      return;
    }

    const result = checkRomajiAnswer(currentCharacter, answer);
    const example = getQuizExample(currentCharacter.kana);
    const attempt: QuizAttempt = {
      character: currentCharacter,
      correctAnswer: result.expectedAnswers[0],
      example,
      imageSource: getVocabularyImage(example?.imageKey),
      isCorrect: result.isCorrect,
      userAnswer: answer.trim(),
    };

    setAttempts((currentAttempts) => [...currentAttempts, attempt]);
    setResultAttempt(attempt);
    Keyboard.dismiss();

    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }

    resultTimerRef.current = setTimeout(goToNextCharacter, 2600);
  }

  function goToNextCharacter() {
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = undefined;
    }

    setResultAttempt(undefined);

    if (currentIndex >= quizItems.length - 1) {
      setCompleted(true);
      Keyboard.dismiss();
      return;
    }

    setCurrentIndex((index) => index + 1);
    setAnswer('');
  }

  function restartQuiz() {
    startRound(activeSeries.id === 'random' ? quizItems : initialItems, false);
  }

  function repeatFailures() {
    if (failures.length === 0) {
      return;
    }

    startRound(
      failures.map((attempt) => attempt.character),
      true,
    );
  }

  function startRound(nextItems: KanaCharacter[], cameFromFailures: boolean) {
    setQuizItems(nextItems);
    setCurrentIndex(0);
    setAnswer('');
    setAttempts([]);
    setCompleted(false);
    setResultAttempt(undefined);
    setCorrectedAllFailures(cameFromFailures && nextItems.length > 0);
  }

  if (resultAttempt) {
    return (
      <QuizResultScreen
        attempt={resultAttempt}
        language={language}
        nextLabel={t.common.next}
        onNext={goToNextCharacter}
      />
    );
  }

  if (completed) {
    return (
      <QuizSummaryScreen
        attempts={attempts}
        backLabel={t.common.back}
        changeModeLabel={t.common.changeMode}
        correctedAllFailures={correctedAllFailures && failures.length === 0}
        correctCount={correctCount}
        language={language}
        nextLabel={language === 'es' ? 'Siguiente serie' : 'Next series'}
        repeatFailuresLabel={language === 'es' ? 'Repetir fallos' : 'Repeat misses'}
        repeatSeriesLabel={language === 'es' ? 'Repetir serie' : 'Repeat series'}
        title={t.quiz.title}
        totalCount={attempts.length}
        onBack={onBack}
        onNextSeries={onNextSeries}
        onRepeatFailures={repeatFailures}
        onRepeatSeries={activeSeries.id === 'random' ? onRepeatSeries : restartQuiz}
      />
    );
  }

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={['romaji', currentCharacter.kana, 'kana']} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.quizContainer}>
        <QuizHeader
          title={t.quiz.title}
          subtitle={activeSeries.title}
          backLabel={t.common.back}
          onBack={onBack}
        />

        <View style={styles.quizKanaCard}>
          <View style={styles.kanaHalo}>
            <Text style={styles.quizKana}>{currentCharacter.kana}</Text>
          </View>
        </View>

        <TextInput
          ref={inputRef}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit
          onChangeText={setAnswer}
          onSubmitEditing={checkAnswer}
          placeholder={language === 'es' ? 'Escribe romaji' : 'Type romaji'}
          placeholderTextColor={colors.disabledText}
          returnKeyType="done"
          style={styles.quizInput}
          value={answer}
        />

        <View style={styles.quizActionButton}>
          <AppButton label={t.common.check} onPress={checkAnswer} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

type QuizResultScreenProps = {
  attempt: QuizAttempt;
  language: 'en' | 'es';
  nextLabel: string;
  onNext: () => void;
};

function QuizResultScreen({ attempt, language, nextLabel, onNext }: QuizResultScreenProps) {
  const wordLabel = attempt.example?.romaji ?? attempt.correctAnswer;
  const meaning =
    attempt.example && language === 'es' ? attempt.example.meaningEs : attempt.example?.meaningEn;

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={[attempt.character.kana, attempt.correctAnswer.toUpperCase(), 'OK']} />
      <View style={styles.resultContainer}>
        <View style={styles.resultCard}>
          <Text style={styles.resultMood}>
            {attempt.isCorrect
              ? language === 'es'
                ? 'Bien'
                : 'Nice'
              : language === 'es'
                ? 'Buen intento'
                : 'Good try'}
          </Text>
          <Text style={styles.resultRomaji}>{attempt.correctAnswer.toUpperCase()}</Text>
          <Text style={styles.resultWord}>
            {language === 'es' ? `como ${wordLabel}` : `as in ${wordLabel}`}
          </Text>
          {attempt.example?.word ? (
            <Text style={styles.resultKanaWord}>{attempt.example.word}</Text>
          ) : null}
          {meaning ? <Text style={styles.resultMeaning}>{meaning}</Text> : null}

          {attempt.imageSource ? (
            <View style={styles.resultImageFrame}>
              <Image resizeMode="contain" source={attempt.imageSource} style={styles.resultImage} />
            </View>
          ) : null}

          {!attempt.isCorrect ? (
            <View style={styles.answerCorrection}>
              <Text style={styles.answerCorrectionText}>
                {language === 'es' ? 'Tu respuesta' : 'Your answer'}:{' '}
                {attempt.userAnswer || '...'}
              </Text>
              <Text style={styles.answerCorrectionText}>
                {language === 'es' ? 'Correcta' : 'Correct'}: {attempt.correctAnswer}
              </Text>
            </View>
          ) : null}

          <View style={styles.resultNextButton}>
            <AppButton label={nextLabel} onPress={onNext} />
          </View>
        </View>
      </View>
    </View>
  );
}

type QuizSummaryScreenProps = {
  attempts: QuizAttempt[];
  backLabel: string;
  changeModeLabel: string;
  correctedAllFailures: boolean;
  correctCount: number;
  language: 'en' | 'es';
  nextLabel: string;
  repeatFailuresLabel: string;
  repeatSeriesLabel: string;
  title: string;
  totalCount: number;
  onBack: () => void;
  onNextSeries: () => void;
  onRepeatFailures: () => void;
  onRepeatSeries: () => void;
};

function QuizSummaryScreen({
  attempts,
  backLabel,
  changeModeLabel,
  correctedAllFailures,
  correctCount,
  language,
  nextLabel,
  repeatFailuresLabel,
  repeatSeriesLabel,
  title,
  totalCount,
  onBack,
  onNextSeries,
  onRepeatFailures,
  onRepeatSeries,
}: QuizSummaryScreenProps) {
  const failures = attempts.filter((attempt) => !attempt.isCorrect);
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={['summary', 'OK', 'romaji']} />
      <View style={styles.summaryContainer}>
        <QuizHeader title={title} backLabel={backLabel} onBack={onBack} />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {correctCount} / {totalCount}
          </Text>
          <Text style={styles.summarySubtitle}>
            {language === 'es'
              ? `${correctCount} aciertos - ${failures.length} fallos - ${percentage}%`
              : `${correctCount} correct - ${failures.length} misses - ${percentage}%`}
          </Text>
          {correctedAllFailures ? (
            <Text style={styles.perfectMessage}>
              {language === 'es'
                ? 'Perfecto! Has corregido todos los fallos.'
                : 'Perfect! You fixed every miss.'}
            </Text>
          ) : null}
        </View>

        {failures.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.missList}
            showsVerticalScrollIndicator={false}
            style={styles.missListScroll}>
            {failures.map((failure, index) => (
              <MissItem key={`${failure.character.id}-${index}`} attempt={failure} language={language} />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.summaryActions}>
          {failures.length > 0 ? (
            <AppButton label={repeatFailuresLabel} onPress={onRepeatFailures} />
          ) : null}
          <AppButton label={repeatSeriesLabel} onPress={onRepeatSeries} variant="secondary" />
          <AppButton label={nextLabel} onPress={onNextSeries} />
          <AppButton label={changeModeLabel} onPress={onBack} variant="secondary" />
        </View>
      </View>
    </View>
  );
}

function MissItem({ attempt, language }: { attempt: QuizAttempt; language: 'en' | 'es' }) {
  const wordLabel = attempt.example?.romaji ?? attempt.correctAnswer;

  return (
    <View style={styles.missItem}>
      {attempt.imageSource ? (
        <View style={styles.missImageFrame}>
          <Image resizeMode="contain" source={attempt.imageSource} style={styles.missImage} />
        </View>
      ) : null}
      <View style={styles.missCopy}>
        <Text style={styles.missKana}>{attempt.character.kana}</Text>
        <Text style={styles.missWord}>
          {wordLabel}
          {attempt.example?.word ? ` - ${attempt.example.word}` : ''}
        </Text>
        <Text style={styles.missAnswers}>
          {language === 'es' ? 'Tu respuesta' : 'Your answer'}: {attempt.userAnswer || '...'} -{' '}
          {language === 'es' ? 'Correcta' : 'Correct'}: {attempt.correctAnswer}
        </Text>
      </View>
    </View>
  );
}

type QuizHeaderProps = {
  backLabel: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
};

function QuizHeader({ backLabel, title, subtitle, onBack }: QuizHeaderProps) {
  return (
    <View style={styles.quizHeader}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.quizBackButton}>
        <Text style={styles.quizBackText}>{`< ${backLabel}`}</Text>
      </Pressable>
      <Text style={styles.quizTitle}>{title}</Text>
      {subtitle ? <Text style={styles.quizSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function getQuizExample(kana: string) {
  return kanaExamples.find((example) => example.kana === kana);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  quizContainer: {
    alignSelf: 'center',
    flex: 1,
    gap: 15,
    justifyContent: 'center',
    maxWidth: 560,
    padding: 20,
    paddingTop: 12,
    width: '100%',
  },
  quizHeader: {
    gap: 4,
  },
  quizBackButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quizBackText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  quizTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  quizSubtitle: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  quizKanaCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.panel,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 210,
    paddingVertical: 18,
    ...softShadow,
  },
  kanaHalo: {
    alignItems: 'center',
    backgroundColor: pastelColors.blue,
    borderRadius: radii.pill,
    height: 166,
    justifyContent: 'center',
    width: 166,
  },
  quizKana: {
    color: colors.text,
    fontSize: 96,
    fontWeight: '800',
    lineHeight: 116,
  },
  quizInput: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    borderWidth: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    minHeight: 58,
    paddingHorizontal: 14,
    textAlign: 'center',
    ...softShadow,
  },
  quizActionButton: {
    alignSelf: 'stretch',
  },
  resultContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  resultCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.panel,
    borderWidth: 1,
    gap: 7,
    maxWidth: 560,
    padding: 18,
    width: '100%',
    ...softShadow,
  },
  resultMood: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  resultRomaji: {
    color: colors.text,
    fontSize: 58,
    fontWeight: '900',
    lineHeight: 66,
  },
  resultWord: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultKanaWord: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: '800',
  },
  resultMeaning: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '700',
  },
  resultImageFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.panel,
    height: 220,
    justifyContent: 'center',
    maxWidth: 320,
    width: '100%',
  },
  resultImage: {
    height: '95%',
    width: '95%',
  },
  answerCorrection: {
    alignItems: 'center',
    backgroundColor: '#F8ECEA',
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  answerCorrectionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  resultNextButton: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
  summaryContainer: {
    alignSelf: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    maxWidth: 720,
    padding: 16,
    width: '100%',
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.panel,
    borderWidth: 1,
    gap: 6,
    padding: 18,
    ...softShadow,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  perfectMessage: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  missListScroll: {
    maxHeight: 230,
  },
  missList: {
    gap: 8,
  },
  missItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  missImageFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  missImage: {
    height: '92%',
    width: '92%',
  },
  missCopy: {
    flex: 1,
    gap: 1,
  },
  missKana: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  missWord: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  missAnswers: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryActions: {
    gap: 8,
  },
});
