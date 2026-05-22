import { useEffect, useRef, useState } from 'react';
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
  type ImageStyle,
  type ImageSourcePropType,
  type StyleProp,
} from 'react-native';

import { checkVocabularyAnswer } from '@/src/features/hiragana/application/useCases/checkVocabularyAnswer';
import type {
  VocabularyImage,
  VocabularyItemWithImages,
} from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import { AppButton } from '@/src/shared/components/AppButton';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { getVocabularyImage } from '@/src/shared/assets/imageRegistry';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useTranslation } from '@/src/shared/i18n/useTranslation';
import { EnterView } from '@/src/shared/motion/EnterView';
import { getCardEnterStyle, softTransition } from '@/src/shared/motion/motionStyles';
import { usePrefersReducedMotion } from '@/src/shared/motion/usePrefersReducedMotion';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type VocabularyPracticeScreenProps = {
  getRemoteImageUrl: (fileName: string) => string | undefined;
  loadPracticeRound: (count: number) => Promise<VocabularyItemWithImages[]>;
  onBack: () => void;
};

type VocabularyPracticeItem = VocabularyItem & {
  localImageSource?: ImageSourcePropType;
  remoteImageUrl?: string;
};

type RoundStep = 'setup' | 'question' | 'result' | 'summary';

type VocabularyAttempt = {
  item: VocabularyPracticeItem;
  isCorrect: boolean;
  userAnswer: string;
};

const countOptions = [5, 10, 20] as const;

export function VocabularyPracticeScreen({
  getRemoteImageUrl,
  loadPracticeRound,
  onBack,
}: VocabularyPracticeScreenProps) {
  const { language, t } = useTranslation();
  const { isMobile, width } = useResponsiveLayout();
  const inputRef = useRef<TextInput>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [step, setStep] = useState<RoundStep>('setup');
  const [selectedCount, setSelectedCount] = useState<number>(5);
  const [roundItems, setRoundItems] = useState<VocabularyPracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState<VocabularyAttempt[]>([]);
  const [resultAttempt, setResultAttempt] = useState<VocabularyAttempt | undefined>();
  const [cameFromFailures, setCameFromFailures] = useState(false);
  const [isLoadingRound, setIsLoadingRound] = useState(false);
  const [failedRemoteImageIds, setFailedRemoteImageIds] = useState<Record<string, true>>({});
  const contentWidth = Math.min(width - 28, isMobile ? 420 : 680);
  const currentItem = roundItems[currentIndex];
  const failures = attempts.filter((attempt) => !attempt.isCorrect);
  const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;

  useEffect(() => {
    if (step === 'question') {
      const timer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [currentIndex, step]);

  useEffect(() => {
    return () => clearResultTimer();
  }, []);

  async function startRandomRound(count = selectedCount) {
    if (isLoadingRound) {
      return;
    }

    setIsLoadingRound(true);

    try {
      startRound(
        await getPresentationPracticeRound(loadPracticeRound, getRemoteImageUrl, count),
        count,
        false,
      );
    } finally {
      setIsLoadingRound(false);
    }
  }

  function startFailureRound() {
    if (failures.length === 0) {
      return;
    }

    startRound(
      failures.map((attempt) => attempt.item),
      failures.length,
      true,
    );
  }

  function startRound(items: VocabularyPracticeItem[], count: number, fromFailures: boolean) {
    clearResultTimer();
    setSelectedCount(count);
    setRoundItems(items);
    setCurrentIndex(0);
    setAnswer('');
    setAttempts([]);
    setResultAttempt(undefined);
    setCameFromFailures(fromFailures);
    setFailedRemoteImageIds({});
    setStep('question');
  }

  function markRemoteImageFailed(itemId: string) {
    setFailedRemoteImageIds((currentFailedIds) => ({
      ...currentFailedIds,
      [itemId]: true,
    }));
  }

  function submitAnswer() {
    if (!currentItem || step !== 'question') {
      return;
    }

    const result = checkVocabularyAnswer(currentItem, answer);
    const attempt: VocabularyAttempt = {
      item: currentItem,
      isCorrect: result.isCorrect,
      userAnswer: answer.trim(),
    };

    setAttempts((currentAttempts) => [...currentAttempts, attempt]);
    setResultAttempt(attempt);
    setStep('result');
    Keyboard.dismiss();

    clearResultTimer();
    resultTimerRef.current = setTimeout(goToNextQuestion, 2600);
  }

  function goToNextQuestion() {
    clearResultTimer();
    setResultAttempt(undefined);

    if (currentIndex >= roundItems.length - 1) {
      setStep('summary');
      setAnswer('');
      return;
    }

    setCurrentIndex((index) => index + 1);
    setAnswer('');
    setStep('question');
  }

  function clearResultTimer() {
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = undefined;
    }
  }

  if (step === 'setup') {
    return (
      <View style={styles.root}>
        <KawaiiBackground kana={['kotoba', 'kana', 'hiragana']} />
        <View style={[styles.setupContainer, { width: contentWidth }]}>
          <TopBackButton label={t.common.back} onBack={onBack} />

          <View style={styles.setupHeader}>
            <Text style={styles.japaneseTitle}>{'\u3053\u3068\u3070'}</Text>
            <Text style={styles.title}>
              {language === 'es' ? 'Practica vocabulario' : 'Vocabulary practice'}
            </Text>
            <Text style={styles.subtitle}>
              {language === 'es'
                ? 'Mira la imagen y escribe la palabra en japones o romaji'
                : 'Look at the picture and type the word in Japanese or romaji'}
            </Text>
          </View>

          <View style={styles.countGrid}>
            {countOptions.map((count, index) => (
              <CountCard
                key={count}
                count={count}
                index={index}
                language={language}
                selected={selectedCount === count}
                onPress={() => setSelectedCount(count)}
              />
            ))}
          </View>

          <AppButton
            label={
              isLoadingRound
                ? language === 'es'
                  ? 'Preparando...'
                  : 'Preparing...'
                : language === 'es'
                  ? 'Empezar'
                  : 'Start'
            }
            onPress={() => startRandomRound(selectedCount)}
          />
        </View>
      </View>
    );
  }

  if (step === 'result' && resultAttempt) {
    return (
      <VocabularyResultScreen
        attempt={resultAttempt}
        language={language}
        nextLabel={t.common.next}
        onNext={goToNextQuestion}
      />
    );
  }

  if (step === 'summary') {
    return (
      <VocabularySummaryScreen
        attempts={attempts}
        cameFromFailures={cameFromFailures}
        correctCount={correctCount}
        language={language}
        repeatCount={selectedCount}
        totalCount={attempts.length}
        onBack={onBack}
        onRepeatFailures={startFailureRound}
        onRepeatRandom={() => startRandomRound(selectedCount)}
      />
    );
  }

  if (!currentItem) {
    return (
      <View style={styles.root}>
        <KawaiiBackground />
        <View style={[styles.setupContainer, { width: contentWidth }]}>
          <TopBackButton label={t.common.back} onBack={onBack} />
          <Text style={styles.title}>
            {language === 'es' ? 'No hay vocabulario disponible' : 'No vocabulary available'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={['kotoba', currentItem.romaji, '\u3053\u3068\u3070']} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.questionContainer, { width: contentWidth }]}>
        <TopBackButton label={t.common.back} onBack={onBack} />

        <View style={styles.progressPill}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {roundItems.length}
          </Text>
        </View>

        <View style={styles.imageCard}>
          <VocabularyImageView
            failedRemoteImageIds={failedRemoteImageIds}
            imageStyle={styles.heroImage}
            item={currentItem}
            onRemoteError={markRemoteImageFailed}
          />
        </View>

        <View style={styles.answerPanel}>
          <Text style={styles.prompt}>
            {language === 'es' ? 'Escribe la palabra' : 'Type the word'}
          </Text>
          <TextInput
            ref={inputRef}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit
            onChangeText={setAnswer}
            onSubmitEditing={submitAnswer}
            placeholder={language === 'es' ? 'japones o romaji' : 'Japanese or romaji'}
            placeholderTextColor={colors.disabledText}
            returnKeyType="done"
            style={styles.input}
            value={answer}
          />
          <AppButton label={t.common.check} onPress={submitAnswer} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function CountCard({
  count,
  index,
  language,
  selected,
  onPress,
}: {
  count: number;
  index: number;
  language: 'en' | 'es';
  selected: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <EnterView index={index} reducedMotion={prefersReducedMotion}>
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.countCard,
        selected ? styles.countCardSelected : null,
        getCardEnterStyle(index, prefersReducedMotion),
        hovered && !prefersReducedMotion ? styles.hovered : null,
        pressed && !prefersReducedMotion ? styles.pressed : null,
      ]}>
      <Text style={[styles.countNumber, selected ? styles.countNumberSelected : null]}>
        {count}
      </Text>
      <Text style={styles.countLabel}>{language === 'es' ? 'palabras' : 'words'}</Text>
    </Pressable>
    </EnterView>
  );
}

function VocabularyResultScreen({
  attempt,
  language,
  nextLabel,
  onNext,
}: {
  attempt: VocabularyAttempt;
  language: 'en' | 'es';
  nextLabel: string;
  onNext: () => void;
}) {
  return (
    <View style={styles.root}>
      <KawaiiBackground kana={[attempt.item.japanese, attempt.item.romaji, 'OK']} />
      <View style={styles.resultContainer}>
        <View style={styles.resultCard}>
          <Text style={[styles.resultMood, attempt.isCorrect ? styles.goodMood : styles.tryMood]}>
            {attempt.isCorrect
              ? language === 'es'
                ? 'Correcto'
                : 'Correct'
              : language === 'es'
                ? 'Incorrecto'
                : 'Incorrect'}
          </Text>
          <Text style={styles.resultJapanese}>{attempt.item.japanese}</Text>
          <Text style={styles.resultRomaji}>{attempt.item.romaji}</Text>
          {!attempt.isCorrect ? (
            <Text style={styles.userAnswer}>
              {language === 'es' ? 'Tu respuesta' : 'Your answer'}: {attempt.userAnswer || '...'}
            </Text>
          ) : null}
          <View style={styles.resultButton}>
            <AppButton label={nextLabel} onPress={onNext} />
          </View>
        </View>
      </View>
    </View>
  );
}

function VocabularySummaryScreen({
  attempts,
  cameFromFailures,
  correctCount,
  language,
  repeatCount,
  totalCount,
  onBack,
  onRepeatFailures,
  onRepeatRandom,
}: {
  attempts: VocabularyAttempt[];
  cameFromFailures: boolean;
  correctCount: number;
  language: 'en' | 'es';
  repeatCount: number;
  totalCount: number;
  onBack: () => void;
  onRepeatFailures: () => void;
  onRepeatRandom: () => void;
}) {
  const failures = attempts.filter((attempt) => !attempt.isCorrect);
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={['summary', '\u3053\u3068\u3070', 'OK']} />
      <View style={styles.summaryContainer}>
        <Text style={styles.title}>
          {language === 'es' ? 'Resumen de vocabulario' : 'Vocabulary summary'}
        </Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryScore}>
            {correctCount} / {totalCount}
          </Text>
          <Text style={styles.summarySubtitle}>
            {language === 'es'
              ? `${correctCount} aciertos - ${failures.length} fallos - ${percentage}%`
              : `${correctCount} correct - ${failures.length} misses - ${percentage}%`}
          </Text>
          {cameFromFailures && failures.length === 0 ? (
            <Text style={styles.perfectMessage}>
              {language === 'es'
                ? 'Perfecto! Has corregido todos los fallos.'
                : 'Perfect! You fixed every miss.'}
            </Text>
          ) : null}
        </View>

        {failures.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.failureList}
            showsVerticalScrollIndicator={false}
            style={styles.failureScroll}>
            {failures.map((attempt, index) => (
              <FailureItem key={`${attempt.item.id}-${index}`} attempt={attempt} language={language} />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.summaryActions}>
          {failures.length > 0 ? (
            <AppButton
              label={language === 'es' ? 'Repetir solo fallos' : 'Repeat misses'}
              onPress={onRepeatFailures}
            />
          ) : null}
          <AppButton
            label={
              language === 'es'
                ? `Repetir ${repeatCount} aleatorias`
                : `Repeat ${repeatCount} random`
            }
            onPress={onRepeatRandom}
            variant="secondary"
          />
          <AppButton
            label={language === 'es' ? 'Volver al menu' : 'Back to menu'}
            onPress={onBack}
            variant="secondary"
          />
        </View>
      </View>
    </View>
  );
}

function FailureItem({
  attempt,
  language,
}: {
  attempt: VocabularyAttempt;
  language: 'en' | 'es';
}) {
  return (
    <View style={styles.failureItem}>
      {attempt.item.localImageSource ? (
        <View style={styles.failureImageFrame}>
          <Image
            resizeMode="contain"
            source={attempt.item.localImageSource}
            style={styles.failureImage}
          />
        </View>
      ) : null}
      <View style={styles.failureCopy}>
        <Text style={styles.failureJapanese}>{attempt.item.japanese}</Text>
        <Text style={styles.failureRomaji}>{attempt.item.romaji}</Text>
        <Text style={styles.failureAnswer}>
          {language === 'es' ? 'Tu respuesta' : 'Your answer'}: {attempt.userAnswer || '...'}
        </Text>
      </View>
    </View>
  );
}

function VocabularyImageView({
  failedRemoteImageIds,
  imageStyle,
  item,
  onRemoteError,
}: {
  failedRemoteImageIds: Record<string, true>;
  imageStyle: StyleProp<ImageStyle>;
  item: VocabularyPracticeItem;
  onRemoteError: (itemId: string) => void;
}) {
  const shouldUseRemoteImage = item.remoteImageUrl && !failedRemoteImageIds[item.id];
  const source = shouldUseRemoteImage ? { uri: item.remoteImageUrl } : item.localImageSource;

  if (!source) {
    return null;
  }

  return (
    <Image
      onError={shouldUseRemoteImage ? () => onRemoteError(item.id) : undefined}
      resizeMode="contain"
      source={source}
      style={imageStyle}
    />
  );
}

function TopBackButton({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
      <Text style={styles.backText}>{`< ${label}`}</Text>
    </Pressable>
  );
}

async function getPresentationPracticeRound(
  loadPracticeRound: (count: number) => Promise<VocabularyItemWithImages[]>,
  getRemoteImageUrl: (fileName: string) => string | undefined,
  count: number,
): Promise<VocabularyPracticeItem[]> {
  const roundItems = await loadPracticeRound(count);

  return roundItems
    .map(({ item, images }) => ({
      ...item,
      localImageSource: getVocabularyImage(images[0]?.localAssetKey),
      remoteImageUrl: resolveVocabularyRemoteImageUrl(images[0], getRemoteImageUrl),
    }))
    .filter((item) => item.localImageSource || item.remoteImageUrl);
}

function resolveVocabularyRemoteImageUrl(
  image: VocabularyImage | undefined,
  getRemoteImageUrl: (fileName: string) => string | undefined,
): string | undefined {
  if (!image) {
    return undefined;
  }

  if (image.imageUrl) {
    return image.imageUrl;
  }

  const fileName = getVocabularyImageFileName(image);

  return fileName ? getRemoteImageUrl(fileName) : undefined;
}

function getVocabularyImageFileName(image: VocabularyImage): string | undefined {
  const imagePath = image.imagePath ?? image.localAssetKey;

  if (!imagePath) {
    return undefined;
  }

  const normalizedPath = imagePath.replaceAll('\\', '/');
  const fileName = normalizedPath.split('/').filter(Boolean).pop();

  if (!fileName) {
    return undefined;
  }

  return fileName.includes('.') ? fileName : `${fileName}.webp`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  setupContainer: {
    alignSelf: 'center',
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    padding: 16,
  },
  setupHeader: {
    alignItems: 'center',
    gap: 5,
  },
  japaneseTitle: {
    color: colors.ink,
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 60,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  countGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  countCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    minWidth: 122,
    paddingHorizontal: 16,
    paddingVertical: 18,
    ...softShadow,
    ...softTransition,
  },
  countCardSelected: {
    backgroundColor: '#F8ECEA',
    borderColor: colors.primary,
  },
  countNumber: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  countNumberSelected: {
    color: colors.primary,
  },
  countLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
  },
  questionContainer: {
    alignSelf: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 16,
  },
  progressPill: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  progressText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '900',
  },
  imageCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.panel,
    borderWidth: 1,
    height: 290,
    justifyContent: 'center',
    padding: 14,
    ...softShadow,
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  answerPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.panel,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    ...softShadow,
  },
  prompt: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    borderWidth: 1,
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    minHeight: 56,
    paddingHorizontal: 14,
    textAlign: 'center',
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
    gap: 8,
    maxWidth: 520,
    padding: 22,
    width: '100%',
    ...softShadow,
  },
  resultMood: {
    borderRadius: radii.pill,
    fontSize: 14,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  goodMood: {
    backgroundColor: colors.successSurface,
    color: colors.success,
  },
  tryMood: {
    backgroundColor: colors.errorSurface,
    color: colors.primary,
  },
  resultJapanese: {
    color: colors.text,
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 68,
    textAlign: 'center',
  },
  resultRomaji: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  userAnswer: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultButton: {
    alignSelf: 'stretch',
    marginTop: 8,
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
    gap: 5,
    padding: 16,
    ...softShadow,
  },
  summaryScore: {
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
  failureScroll: {
    maxHeight: 260,
  },
  failureList: {
    gap: 8,
  },
  failureItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  failureImageFrame: {
    alignItems: 'center',
    backgroundColor: pastelColors.blue,
    borderRadius: 14,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  failureImage: {
    height: '92%',
    width: '92%',
  },
  failureCopy: {
    flex: 1,
    gap: 1,
  },
  failureJapanese: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  failureRomaji: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  failureAnswer: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryActions: {
    gap: 8,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  hovered: {
    shadowOpacity: 0.14,
    shadowRadius: 24,
    transform: [{ translateY: -4 }, { scale: 1.012 }],
  },
});
