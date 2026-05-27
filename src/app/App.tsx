import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { KanaTokenizerService } from '@/src/features/hiragana/application/services/KanaTokenizerService';
import { CreateVocabularyDraftUseCase } from '@/src/features/hiragana/application/useCases/CreateVocabularyDraftUseCase';
import { createRandomKanaSeries } from '@/src/features/hiragana/application/useCases/createRandomKanaSeries';
import { EvaluateMemoryHandwritingUseCase } from '@/src/features/hiragana/application/useCases/EvaluateMemoryHandwritingUseCase';
import { GenerateMemoryHandwritingCollageUseCase } from '@/src/features/hiragana/application/useCases/GenerateMemoryHandwritingCollageUseCase';
import { GetKanaSeriesUseCase } from '@/src/features/hiragana/application/useCases/GetKanaSeriesUseCase';
import { GetVocabularyByKanaUseCase } from '@/src/features/hiragana/application/useCases/GetVocabularyByKanaUseCase';
import { GetWritingTemplateUseCase } from '@/src/features/hiragana/application/useCases/GetWritingTemplateUseCase';
import { getPracticeModes } from '@/src/features/hiragana/application/useCases/getPracticeModes';
import { getVocabularyPracticeRound } from '@/src/features/hiragana/application/useCases/getVocabularyPracticeRound';
import { ResolveKanaSeriesUseCase } from '@/src/features/hiragana/application/useCases/ResolveKanaSeriesUseCase';
import { SearchDictionaryCandidatesUseCase } from '@/src/features/hiragana/application/useCases/SearchDictionaryCandidatesUseCase';
import { TokenizeKanaUseCase } from '@/src/features/hiragana/application/useCases/TokenizeKanaUseCase';
import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type { HandwritingEvaluationResult } from '@/src/features/hiragana/domain/models/HandwritingEvaluation';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { MemoryHandwritingCollage } from '@/src/features/hiragana/domain/models/MemoryHandwritingCollage';
import type { MemoryHandwritingDrawing } from '@/src/features/hiragana/domain/models/MemoryHandwritingDrawing';
import type { MemoryPracticeVariant } from '@/src/features/hiragana/domain/models/MemoryPracticeVariant';
import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';
import { createDictionaryRepository } from '@/src/features/hiragana/infrastructure/repositories/createDictionaryRepository';
import { createKanaCatalogRepository } from '@/src/features/hiragana/infrastructure/repositories/createKanaCatalogRepository';
import { createVocabularyDraftRepository } from '@/src/features/hiragana/infrastructure/repositories/createVocabularyDraftRepository';
import { createVocabularyRepository } from '@/src/features/hiragana/infrastructure/repositories/createVocabularyRepository';
import { LocalSpanishToEnglishDictionaryRepository } from '@/src/features/hiragana/infrastructure/repositories/LocalSpanishToEnglishDictionaryRepository';
import { LocalWritingTemplateRepository } from '@/src/features/hiragana/infrastructure/repositories/LocalWritingTemplateRepository';
import { SvgMemoryHandwritingCollageService } from '@/src/features/hiragana/infrastructure/services/SvgMemoryHandwritingCollageService';
import { createHandwritingEvaluationPort } from '@/src/features/hiragana/infrastructure/services/createHandwritingEvaluationPort';
import { AddVocabularyFlowScreen } from '@/src/features/hiragana/presentation/screens/AddVocabularyFlowScreen';
import { FlashcardScreen } from '@/src/features/hiragana/presentation/screens/FlashcardScreen';
import { HiraganaSeriesScreen } from '@/src/features/hiragana/presentation/screens/HiraganaSeriesScreen';
import { HomeScreen } from '@/src/features/hiragana/presentation/screens/HomeScreen';
import { KanaWritingPracticeScreen } from '@/src/features/hiragana/presentation/screens/KanaWritingPracticeScreen';
import { MemoryPracticeVariantSelectionScreen } from '@/src/features/hiragana/presentation/screens/MemoryPracticeVariantSelectionScreen';
import { PracticeModeSelectionScreen } from '@/src/features/hiragana/presentation/screens/PracticeModeSelectionScreen';
import { RomajiQuizScreen } from '@/src/features/hiragana/presentation/screens/RomajiQuizScreen';
import { VocabularyPracticeScreen } from '@/src/features/hiragana/presentation/screens/VocabularyPracticeScreen';
import { createPinAuthRepository } from '@/src/features/user/infrastructure/repositories/createPinAuthRepository';
import { createUserRepository, createUserSettingsRepository } from '@/src/features/user/infrastructure/repositories/createUserRepositories';
import { ExpoLocalUserSessionStorage } from '@/src/features/user/infrastructure/storage/ExpoLocalUserSessionStorage';
import { UserSessionProvider, useUserSession } from '@/src/features/user/presentation/context/UserSessionContext';
import { PinLoginScreen } from '@/src/features/user/presentation/screens/PinLoginScreen';
import { UserProfileScreen } from '@/src/features/user/presentation/screens/UserProfileScreen';
import { getVocabularyImageUrl } from '@/src/infrastructure/supabase/storage/getVocabularyImageUrl';
import { colors } from '@/src/shared/constants/colors';
import { LanguageProvider } from '@/src/shared/i18n/useTranslation';
import { AnimatedRouteContainer } from '@/src/shared/motion/AnimatedRouteContainer';
import { MotionStyleSheet } from '@/src/shared/motion/MotionStyleSheet';

type WritingMode = Extract<PracticeMode, 'trace' | 'memory'>;

type AppRoute =
  | { name: 'home' }
  | { name: 'addVocabulary' }
  | { name: 'userProfile' }
  | { name: 'hiraganaSeries' }
  | { name: 'seriesPractice'; seriesId: string }
  | { name: 'practiceModes'; series: KanaSeries }
  | { name: 'flashcards'; series: KanaSeries }
  | { name: 'memoryPracticeVariant'; series: KanaSeries; fromSeriesPractice?: boolean }
  | {
      name: 'writingPractice';
      mode: WritingMode;
      series: KanaSeries;
      fromSeriesPractice?: boolean;
      memoryPracticeVariant?: MemoryPracticeVariant;
    }
  | { name: 'romajiQuiz'; series: KanaSeries; fromSeriesPractice?: boolean }
  | { name: 'vocabularyPractice' };

export default function SingraKanaApp() {
  const [route, setRoute] = useState<AppRoute>({ name: 'home' });
  const [kanaSeries, setKanaSeries] = useState<KanaSeries[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(true);

  const kanaCatalogRepository = useMemo(() => createKanaCatalogRepository(), []);
  const dictionaryRepository = useMemo(() => createDictionaryRepository(), []);
  const spanishToEnglishDictionaryRepository = useMemo(
    () => new LocalSpanishToEnglishDictionaryRepository(),
    [],
  );
  const vocabularyRepository = useMemo(() => createVocabularyRepository(), []);
  const vocabularyDraftRepository = useMemo(() => createVocabularyDraftRepository(), []);
  const pinAuthRepository = useMemo(() => createPinAuthRepository(), []);
  const userRepository = useMemo(() => createUserRepository(), []);
  const userSettingsRepository = useMemo(() => createUserSettingsRepository(), []);
  const localUserSessionStorage = useMemo(() => new ExpoLocalUserSessionStorage(), []);
  const writingTemplateRepository = useMemo(() => new LocalWritingTemplateRepository(), []);
  const handwritingEvaluationPort = useMemo(() => createHandwritingEvaluationPort(), []);
  const memoryHandwritingCollageService = useMemo(
    () => new SvgMemoryHandwritingCollageService(),
    [],
  );
  const kanaTokenizerService = useMemo(() => new KanaTokenizerService(), []);
  const practiceModes = useMemo(() => getPracticeModes(), []);
  const searchDictionaryCandidates = useMemo(() => {
    const useCase = new SearchDictionaryCandidatesUseCase(
      dictionaryRepository,
      spanishToEnglishDictionaryRepository,
    );
    return {
      searchInitial: (query: string) => useCase.searchCombined(query),
      searchExternal: (query: string, existingCandidates: DictionaryCandidate[]) =>
        useCase.searchExternal(query).then((newCandidates) =>
          useCase.combine(existingCandidates, newCandidates),
        ),
    };
  }, [dictionaryRepository, spanishToEnglishDictionaryRepository]);
  const tokenizeKana = useMemo(() => {
    const useCase = new TokenizeKanaUseCase(kanaTokenizerService);
    return (value: string) => useCase.execute(value);
  }, [kanaTokenizerService]);
  const resolveKanaSeries = useMemo(() => {
    const useCase = new ResolveKanaSeriesUseCase(kanaCatalogRepository);
    return (kana: string) => useCase.execute(kana);
  }, [kanaCatalogRepository]);
  const createVocabularyDraft = useMemo(() => {
    const useCase = new CreateVocabularyDraftUseCase(vocabularyDraftRepository);
    return useCase.execute.bind(useCase);
  }, [vocabularyDraftRepository]);
  const loadVocabularyByKana = useMemo(() => {
    const useCase = new GetVocabularyByKanaUseCase(vocabularyRepository);
    return (kana: string) => useCase.execute(kana);
  }, [vocabularyRepository]);
  const loadVocabularyPracticeRound = useMemo(() => {
    return (count: number) => getVocabularyPracticeRound(vocabularyRepository, count);
  }, [vocabularyRepository]);
  const loadWritingTemplate = useMemo(() => {
    const useCase = new GetWritingTemplateUseCase(writingTemplateRepository);
    return (kana: string) => useCase.execute(kana);
  }, [writingTemplateRepository]);
  const evaluateMemoryHandwriting = useMemo(() => {
    const useCase = new EvaluateMemoryHandwritingUseCase(handwritingEvaluationPort);
    return (
      drawings: MemoryHandwritingDrawing[],
      seriesId: string,
      collageImageUri?: string,
      collageImageBase64?: string,
      collageImageMimeType?: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | 'image/svg+xml',
      collageCanvasSize?: { height: number; width: number },
      collageStrokeWidth?: number,
    ): Promise<HandwritingEvaluationResult | undefined> =>
      useCase.execute({
        collageCanvasSize,
        collageImageBase64,
        collageImageMimeType,
        collageImageUri,
        collageStrokeWidth,
        drawings,
        seriesId,
      });
  }, [handwritingEvaluationPort]);
  const generateMemoryHandwritingCollage = useMemo(() => {
    const useCase = new GenerateMemoryHandwritingCollageUseCase(memoryHandwritingCollageService);
    return (drawings: MemoryHandwritingDrawing[]): Promise<MemoryHandwritingCollage | undefined> =>
      useCase.execute(drawings);
  }, [memoryHandwritingCollageService]);

  useEffect(() => {
    let isMounted = true;
    const useCase = new GetKanaSeriesUseCase(kanaCatalogRepository);

    async function loadSeries() {
      setIsLoadingSeries(true);

      try {
        const availableSeries = await useCase.execute();

        if (isMounted) {
          setKanaSeries(availableSeries);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSeries(false);
        }
      }
    }

    loadSeries();

    return () => {
      isMounted = false;
    };
  }, [kanaCatalogRepository]);

  const goBack = useCallback(() => {
    if (route.name === 'home') {
      return;
    }

    if (route.name === 'addVocabulary' || route.name === 'userProfile') {
      setRoute({ name: 'home' });
      return;
    }

    if (route.name === 'hiraganaSeries') {
      setRoute({ name: 'home' });
      return;
    }

    if (route.name === 'seriesPractice') {
      setRoute({ name: 'hiraganaSeries' });
      return;
    }

    if (route.name === 'practiceModes') {
      setRoute({ name: 'hiraganaSeries' });
      return;
    }

    if (route.name === 'flashcards') {
      setRoute({ name: 'practiceModes', series: route.series });
      return;
    }

    if (route.name === 'memoryPracticeVariant') {
      setRoute(getPracticeBackRoute(route.series, route.fromSeriesPractice));
      return;
    }

    if (route.name === 'writingPractice') {
      setRoute(getPracticeBackRoute(route.series, route.fromSeriesPractice));
      return;
    }

    if (route.name === 'romajiQuiz') {
      setRoute(getPracticeBackRoute(route.series, route.fromSeriesPractice));
      return;
    }

    if (route.name === 'vocabularyPractice') {
      setRoute({ name: 'hiraganaSeries' });
    }
  }, [route]);

  return (
    <SafeAreaView style={styles.container}>
      <UserSessionProvider
        localUserSessionStorage={localUserSessionStorage}
        pinAuthRepository={pinAuthRepository}
        userRepository={userRepository}
        userSettingsRepository={userSettingsRepository}
      >
        <LanguageProvider>
          <MotionStyleSheet />
          <SessionGate
            isUserProfileRoute={route.name === 'userProfile'}
            onOpenUserProfile={() => setRoute({ name: 'userProfile' })}
            onReturnHome={() => setRoute({ name: 'home' })}
            onSwipeBack={goBack}
          >
          <AnimatedRouteContainer routeKey={getRouteKey(route)}>
          {route.name === 'home' ? (
            <HomeScreen
              onOpenAddVocabulary={() => setRoute({ name: 'addVocabulary' })}
              onOpenHiragana={() => setRoute({ name: 'hiraganaSeries' })}
            />
          ) : null}

          {route.name === 'userProfile' ? (
            <UserProfileScreen onBack={() => setRoute({ name: 'home' })} />
          ) : null}

          {route.name === 'addVocabulary' ? (
            <AddVocabularyFlowScreen
              createDraft={createVocabularyDraft}
              resolveKanaSeries={resolveKanaSeries}
              searchExternalCandidates={searchDictionaryCandidates.searchExternal}
              searchInitialCandidates={searchDictionaryCandidates.searchInitial}
              tokenizeKana={tokenizeKana}
              onBack={() => setRoute({ name: 'home' })}
            />
          ) : null}

          {route.name === 'hiraganaSeries' ? (
            isLoadingSeries || kanaSeries.length === 0 ? (
              <DataStateMessage label={isLoadingSeries ? 'Cargando series...' : 'No hay series disponibles'} />
            ) : (
              <HiraganaSeriesScreen
                series={kanaSeries}
                onBack={() => setRoute({ name: 'home' })}
                onOpenVocabulary={() => setRoute({ name: 'vocabularyPractice' })}
                onSelectRandom={() => {
                  const randomSeries = createRandomKanaSeries(kanaSeries);
                  setRoute({ name: 'practiceModes', series: randomSeries });
                }}
                onOpenSeriesPractice={() =>
                  setRoute({ name: 'seriesPractice', seriesId: kanaSeries[0]?.id ?? 'hiragana-vowels' })
                }
              />
            )
          ) : null}

          {route.name === 'seriesPractice' && kanaSeries.length > 0 ? (
            <PracticeModeSelectionScreen
              practiceModes={practiceModes}
              series={getSeriesById(route.seriesId, kanaSeries)}
              seriesOptions={kanaSeries}
              onBack={() => setRoute({ name: 'hiraganaSeries' })}
              onSelectSeries={(seriesId) => setRoute({ name: 'seriesPractice', seriesId })}
              onSelectMode={(mode) => {
                const selectedSeries = getSeriesById(route.seriesId, kanaSeries);

                if (mode === 'romajiQuiz') {
                  setRoute({
                    name: 'romajiQuiz',
                    series: selectedSeries,
                    fromSeriesPractice: true,
                  });
                  return;
                }

                if (mode === 'vocabulary') {
                  setRoute({ name: 'vocabularyPractice' });
                  return;
                }

                if (mode === 'memory') {
                  setRoute({
                    name: 'memoryPracticeVariant',
                    series: selectedSeries,
                    fromSeriesPractice: true,
                  });
                  return;
                }

                setRoute({
                  name: 'writingPractice',
                  mode,
                  series: selectedSeries,
                  fromSeriesPractice: true,
                });
              }}
            />
          ) : null}

          {route.name === 'practiceModes' ? (
            <PracticeModeSelectionScreen
              practiceModes={practiceModes}
              series={route.series}
              onBack={() => setRoute({ name: 'hiraganaSeries' })}
              onSelectMode={(mode) => {
                if (mode === 'romajiQuiz') {
                  setRoute({ name: 'romajiQuiz', series: route.series });
                  return;
                }

                if (mode === 'vocabulary') {
                  setRoute({ name: 'vocabularyPractice' });
                  return;
                }

                if (mode === 'memory') {
                  setRoute({
                    name: 'memoryPracticeVariant',
                    series: route.series,
                  });
                  return;
                }

                setRoute({ name: 'writingPractice', mode, series: route.series });
              }}
            />
          ) : null}

          {route.name === 'memoryPracticeVariant' ? (
            <MemoryPracticeVariantSelectionScreen
              series={route.series}
              onBack={() => setRoute(getPracticeBackRoute(route.series, route.fromSeriesPractice))}
              onSelectVariant={(memoryPracticeVariant) =>
                setRoute({
                  name: 'writingPractice',
                  mode: 'memory',
                  series: route.series,
                  fromSeriesPractice: route.fromSeriesPractice,
                  memoryPracticeVariant,
                })
              }
            />
          ) : null}

          {route.name === 'flashcards' ? (
            <FlashcardScreen
              series={route.series}
              onBack={() => setRoute({ name: 'practiceModes', series: route.series })}
              onNextSeries={() =>
                setRoute({
                  name: 'flashcards',
                  series: getNextSeries(route.series, kanaSeries),
                })
              }
              onRepeatSeries={() =>
                setRoute({
                  name: 'flashcards',
                  series: getRepeatSeries(route.series, kanaSeries),
                })
              }
            />
          ) : null}

          {route.name === 'writingPractice' ? (
            <KanaWritingPracticeScreen
              evaluateMemoryHandwriting={evaluateMemoryHandwriting}
              generateMemoryHandwritingCollage={generateMemoryHandwritingCollage}
              getRemoteImageUrl={getVocabularyImageUrl}
              loadWritingTemplate={loadWritingTemplate}
              loadVocabularyByKana={loadVocabularyByKana}
              seriesOptions={kanaSeries}
              mode={route.mode}
              memoryPracticeVariant={route.memoryPracticeVariant}
              series={route.series}
              seriesId={route.series.id}
              onBack={() => setRoute(getPracticeBackRoute(route.series, route.fromSeriesPractice))}
              onNextSeries={() =>
                setRoute({
                  name: 'writingPractice',
                  mode: route.mode,
                  series: getNextSeries(route.series, kanaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
                  memoryPracticeVariant: route.memoryPracticeVariant,
                })
              }
              onRepeatSeries={() =>
                setRoute({
                  name: 'writingPractice',
                  mode: route.mode,
                  series: getRepeatSeries(route.series, kanaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
                  memoryPracticeVariant: route.memoryPracticeVariant,
                })
              }
            />
          ) : null}

          {route.name === 'romajiQuiz' ? (
            <RomajiQuizScreen
              getRemoteImageUrl={getVocabularyImageUrl}
              loadVocabularyByKana={loadVocabularyByKana}
              series={route.series}
              seriesId={route.series.id}
              onBack={() => setRoute(getPracticeBackRoute(route.series, route.fromSeriesPractice))}
              onNextSeries={() =>
                setRoute({
                  name: 'romajiQuiz',
                  series: getNextSeries(route.series, kanaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
                })
              }
              onRepeatSeries={() =>
                setRoute({
                  name: 'romajiQuiz',
                  series: getRepeatSeries(route.series, kanaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
                })
              }
            />
          ) : null}

          {route.name === 'vocabularyPractice' ? (
            <VocabularyPracticeScreen
              getRemoteImageUrl={getVocabularyImageUrl}
              loadPracticeRound={loadVocabularyPracticeRound}
              onBack={() => setRoute({ name: 'hiraganaSeries' })}
            />
          ) : null}
          </AnimatedRouteContainer>
          </SessionGate>
        </LanguageProvider>
      </UserSessionProvider>
    </SafeAreaView>
  );
}

function SessionGate({
  children,
  isUserProfileRoute,
  onOpenUserProfile,
  onReturnHome,
  onSwipeBack,
}: {
  children: ReactNode;
  isUserProfileRoute: boolean;
  onOpenUserProfile: () => void;
  onReturnHome: () => void;
  onSwipeBack: () => void;
}) {
  const { currentUser, isAuthenticated, isLoading, loginWithPin } = useUserSession();
  const touchStartRef = useRef<{ pageX: number; pageY: number; time: number } | undefined>(undefined);

  if (isLoading && !isAuthenticated) {
    return <DataStateMessage label="Preparando tu sesión..." />;
  }

  if (!isAuthenticated) {
    return <PinLoginScreen isLoading={isLoading} onSubmit={(pin) => loginWithPin(pin, 'adri')} />;
  }

  return (
    <View
      style={styles.authenticatedShell}
      onTouchEnd={(event) => handleSwipeBackEnd(event, touchStartRef.current, onSwipeBack)}
      onTouchStart={(event) => {
        touchStartRef.current = {
          pageX: event.nativeEvent.pageX,
          pageY: event.nativeEvent.pageY,
          time: Date.now(),
        };
      }}>
      <View style={styles.userBadgePosition}>
        <Pressable
          accessibilityLabel="Abrir perfil"
          accessibilityRole="button"
          onPress={isUserProfileRoute ? onReturnHome : onOpenUserProfile}
          style={({ pressed }) => [styles.userBadge, pressed ? styles.userBadgePressed : null]}>
          <Text style={styles.userBadgeLabel}>
            {isUserProfileRoute ? 'Volver' : `@${currentUser?.username ?? 'adri'}`}
          </Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function handleSwipeBackEnd(
  event: GestureResponderEvent,
  start: { pageX: number; pageY: number; time: number } | undefined,
  onSwipeBack: () => void,
) {
  if (!start || start.pageX > 32) {
    return;
  }

  const dx = event.nativeEvent.pageX - start.pageX;
  const dy = event.nativeEvent.pageY - start.pageY;
  const elapsed = Date.now() - start.time;

  if (dx > 82 && Math.abs(dy) < 64 && elapsed < 800) {
    onSwipeBack();
  }
}

function getRouteKey(route: AppRoute) {
  if (route.name === 'writingPractice') {
    return `${route.name}-${getSeriesRouteKey(route.series)}-${route.mode}-${route.memoryPracticeVariant ?? 'default'}`;
  }

  if (route.name === 'memoryPracticeVariant') {
    return `${route.name}-${getSeriesRouteKey(route.series)}`;
  }

  if ('series' in route) {
    return `${route.name}-${getSeriesRouteKey(route.series)}`;
  }

  return route.name;
}

function getSeriesById(seriesId: string, series: KanaSeries[]) {
  return series.find((item) => item.id === seriesId) ?? series[0];
}

function getPracticeBackRoute(series: KanaSeries, fromSeriesPractice?: boolean): AppRoute {
  if (fromSeriesPractice && series.id !== 'random') {
    return { name: 'seriesPractice', seriesId: series.id };
  }

  return { name: 'practiceModes', series };
}

function getSeriesRouteKey(series: KanaSeries) {
  if (series.id !== 'random') {
    return series.id;
  }

  return `${series.id}-${series.characters.map((character) => character.kana).join('')}`;
}

function getNextSeries(currentSeries: KanaSeries, series: KanaSeries[]) {
  const currentIndex = series.findIndex((item) => item.id === currentSeries.id);

  if (series.length === 0) {
    return currentSeries;
  }

  if (currentIndex === -1) {
    return createRandomKanaSeries(series);
  }

  return series[(currentIndex + 1) % series.length];
}

function getRepeatSeries(currentSeries: KanaSeries, series: KanaSeries[]) {
  if (currentSeries.id === 'random' && series.length > 0) {
    return createRandomKanaSeries(series);
  }

  return currentSeries;
}

function DataStateMessage({ label }: { label: string }) {
  return (
    <View style={styles.stateContainer}>
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  authenticatedShell: {
    flex: 1,
  },
  userBadgePosition: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 12,
    zIndex: 20,
  },
  userBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: 12,
  },
  userBadgeLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 32,
  },
  userBadgePressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  stateText: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
