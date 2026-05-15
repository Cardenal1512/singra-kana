import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { checkRomajiAnswer } from '@/src/features/hiragana/application/useCases/checkRomajiAnswer';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import { hiraganaSeries } from '@/src/features/hiragana/infrastructure/data/hiraganaSeries';
import { AppButton } from '@/src/shared/components/AppButton';
import { colors } from '@/src/shared/constants/colors';
import { useTranslation } from '@/src/shared/i18n/useTranslation';

type RomajiQuizScreenProps = {
  series?: KanaSeries;
  seriesId: string;
  onBack: () => void;
};

export function RomajiQuizScreen({
  series: providedSeries,
  seriesId,
  onBack,
}: RomajiQuizScreenProps) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const series = providedSeries ?? hiraganaSeries.find((item) => item.id === seriesId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [expectedAnswers, setExpectedAnswers] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!checked && !completed) {
      const timer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [checked, completed, currentIndex]);

  if (!series) {
    return (
      <View style={styles.quizContainer}>
        <QuizHeader title="Series not found" backLabel={t.common.back} onBack={onBack} />
      </View>
    );
  }

  const selectedSeries = series;
  const currentCharacter = selectedSeries.characters[currentIndex];

  function checkAnswer() {
    if (checked) {
      return;
    }

    const result = checkRomajiAnswer(currentCharacter, answer);
    setIsCorrect(result.isCorrect);
    setExpectedAnswers(result.expectedAnswers);
    setChecked(true);
    Keyboard.dismiss();

    if (result.isCorrect) {
      setCorrectCount((count) => count + 1);
    }
  }

  function goToNextCharacter() {
    if (currentIndex >= selectedSeries.characters.length - 1) {
      setCompleted(true);
      Keyboard.dismiss();
      return;
    }

    setCurrentIndex((index) => index + 1);
    setAnswer('');
    setChecked(false);
    setIsCorrect(false);
    setExpectedAnswers([]);
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setAnswer('');
    setChecked(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setExpectedAnswers([]);
    setCompleted(false);
  }

  if (completed) {
    return (
      <View style={styles.quizContainer}>
        <QuizHeader title={t.quiz.title} backLabel={t.common.back} onBack={onBack} />

        <View style={styles.summaryCard}>
          <Text style={styles.summary}>
            {correctCount} / {selectedSeries.characters.length}
          </Text>
        </View>

        <AppButton label={t.common.restart} onPress={restartQuiz} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.quizContainer}>
      <QuizHeader
        title={t.quiz.title}
        subtitle={selectedSeries.title}
        backLabel={t.common.back}
        onBack={onBack}
      />

      <View style={styles.quizKanaCard}>
        <Text style={styles.quizKana}>{currentCharacter.kana}</Text>
      </View>

      <TextInput
        ref={inputRef}
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit
        editable={!checked}
        onChangeText={setAnswer}
        onSubmitEditing={checkAnswer}
        placeholder="Type romaji"
        placeholderTextColor={colors.disabledText}
        returnKeyType="done"
        style={styles.quizInput}
        value={answer}
      />

      {checked ? (
        <View style={[styles.feedbackBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
          <Text style={[styles.feedback, isCorrect ? styles.correct : styles.incorrect]}>
            {isCorrect ? t.quiz.correct : `${t.quiz.correctAnswer}: ${expectedAnswers[0]}`}
          </Text>
        </View>
      ) : (
        <View style={styles.feedbackSpacer} />
      )}

      <View style={styles.quizActionButton}>
        {checked ? (
          <AppButton label={t.common.next} onPress={goToNextCharacter} />
        ) : (
          <AppButton label={t.common.check} onPress={checkAnswer} />
        )}
      </View>
    </KeyboardAvoidingView>
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
        <Text style={styles.quizBackText}>{backLabel}</Text>
      </Pressable>
      <Text style={styles.quizTitle}>{title}</Text>
      {subtitle ? <Text style={styles.quizSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  quizContainer: {
    flex: 1,
    gap: 15,
    padding: 20,
    paddingTop: 12,
  },
  quizHeader: {
    gap: 4,
  },
  quizBackButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quizBackText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  quizTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    marginTop: 8,
  },
  quizSubtitle: {
    color: colors.mutedText,
    fontSize: 15,
  },
  quizKanaCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 150,
    paddingVertical: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 1,
  },
  quizKana: {
    color: colors.text,
    fontSize: 96,
    fontWeight: '700',
    lineHeight: 116,
  },
  quizInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 22,
    minHeight: 54,
    paddingHorizontal: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  quizActionButton: {
    alignSelf: 'stretch',
  },
  feedback: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  feedbackBadge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  feedbackSpacer: {
    minHeight: 34,
  },
  correct: {
    color: colors.success,
  },
  incorrect: {
    color: colors.error,
  },
  correctBadge: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  incorrectBadge: {
    backgroundColor: colors.errorSurface,
    borderColor: colors.errorBorder,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 160,
    padding: 24,
  },
  summary: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
  },
});
