import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AppState,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { KanaTokenizerService } from '@/src/features/hiragana/application/services/KanaTokenizerService';
import { CreateVocabularyDraftUseCase } from '@/src/features/hiragana/application/useCases/CreateVocabularyDraftUseCase';
import { createRandomKanaSeries } from '@/src/features/hiragana/application/useCases/createRandomKanaSeries';
import { EvaluateMemoryHandwritingUseCase } from '@/src/features/hiragana/application/useCases/EvaluateMemoryHandwritingUseCase';
import { GenerateMemoryHandwritingCollageUseCase } from '@/src/features/hiragana/application/useCases/GenerateMemoryHandwritingCollageUseCase';
import { GetKanaSeriesUseCase } from '@/src/features/hiragana/application/useCases/GetKanaSeriesUseCase';
import { GetVocabularyByKanaUseCase } from '@/src/features/hiragana/application/useCases/GetVocabularyByKanaUseCase';
import { GetWritingTemplateUseCase } from '@/src/features/hiragana/application/useCases/GetWritingTemplateUseCase';
import { RecordPracticeSessionUseCase } from '@/src/features/hiragana/application/useCases/RecordPracticeSessionUseCase';
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
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import { createDictionaryRepository } from '@/src/features/hiragana/infrastructure/repositories/createDictionaryRepository';
import { createKanaCatalogRepository } from '@/src/features/hiragana/infrastructure/repositories/createKanaCatalogRepository';
import { createPracticeSessionRepository } from '@/src/features/hiragana/infrastructure/repositories/createPracticeSessionRepository';
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
import { VocabularyGalleryScreen } from '@/src/features/hiragana/presentation/screens/VocabularyGalleryScreen';
import { VocabularyDetailScreen } from '@/src/features/hiragana/presentation/screens/VocabularyDetailScreen';
import { VocabularyPracticeScreen } from '@/src/features/hiragana/presentation/screens/VocabularyPracticeScreen';
import { VocabularySeriesScreen } from '@/src/features/hiragana/presentation/screens/VocabularySeriesScreen';
import { createPinAuthRepository } from '@/src/features/user/infrastructure/repositories/createPinAuthRepository';
import { createAppUsageRepository } from '@/src/features/user/infrastructure/repositories/createAppUsageRepository';
import { createUserRepository, createUserSettingsRepository } from '@/src/features/user/infrastructure/repositories/createUserRepositories';
import { RecordAppUsageUseCase } from '@/src/features/user/application/useCases/RecordAppUsageUseCase';
import { ExpoLocalUserSessionStorage } from '@/src/features/user/infrastructure/storage/ExpoLocalUserSessionStorage';
import { UserSessionProvider, useUserSession } from '@/src/features/user/presentation/context/UserSessionContext';
import { PinLoginScreen } from '@/src/features/user/presentation/screens/PinLoginScreen';
import { UserProfileScreen } from '@/src/features/user/presentation/screens/UserProfileScreen';
import { getVocabularyImageUrl } from '@/src/infrastructure/supabase/storage/getVocabularyImageUrl';
import { AudioProvider } from '@/src/shared/audio/AudioProvider';
import { playMusic, playSound, type MusicKey } from '@/src/shared/audio/AudioService';
import { colors } from '@/src/shared/constants/colors';
import { LanguageProvider } from '@/src/shared/i18n/useTranslation';
import { MotionStyleSheet } from '@/src/shared/motion/MotionStyleSheet';

type WritingMode = Extract<PracticeMode, 'trace' | 'memory'>;

type AppStackParamList = {
  addVocabulary: undefined;
  flashcards: { series: KanaSeries };
  hiraganaSeries: undefined;
  home: undefined;
  memoryPracticeVariant: { fromSeriesPractice?: boolean; series: KanaSeries };
  practiceModes: { series: KanaSeries };
  romajiQuiz: { fromSeriesPractice?: boolean; series: KanaSeries };
  seriesPractice: { seriesId: string };
  userProfile: undefined;
  vocabularyDetail: { initialIndex: number; series: KanaSeries; vocabulary: VocabularyItem[] };
  vocabularyGallery: undefined;
  vocabularyPractice: { seriesId?: string; seriesTitle?: string; vocabularyItemId?: string } | undefined;
  vocabularySeries: { series: KanaSeries; vocabulary: VocabularyItem[] };
  writingPractice: {
    fromSeriesPractice?: boolean;
    memoryPracticeVariant?: MemoryPracticeVariant;
    mode: WritingMode;
    series: KanaSeries;
  };
};

type ScreenProps<RouteName extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  RouteName
>;

const Stack = createNativeStackNavigator<AppStackParamList>();
const showFallbackBackButton = Platform.OS !== 'ios';
let lastBackSoundAt = 0;

export default function SingraKanaApp() {
  const kanaCatalogRepository = useMemo(() => createKanaCatalogRepository(), []);
  const dictionaryRepository = useMemo(() => createDictionaryRepository(), []);
  const spanishToEnglishDictionaryRepository = useMemo(
    () => new LocalSpanishToEnglishDictionaryRepository(),
    [],
  );
  const vocabularyRepository = useMemo(() => createVocabularyRepository(), []);
  const vocabularyDraftRepository = useMemo(() => createVocabularyDraftRepository(), []);
  const practiceSessionRepository = useMemo(() => createPracticeSessionRepository(), []);
  const appUsageRepository = useMemo(() => createAppUsageRepository(), []);
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

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.container}>
        <UserSessionProvider
          localUserSessionStorage={localUserSessionStorage}
          pinAuthRepository={pinAuthRepository}
          userRepository={userRepository}
          userSettingsRepository={userSettingsRepository}
        >
          <AudioProvider>
            <LanguageProvider>
              <MotionStyleSheet />
              <SessionGate
                dictionaryRepository={dictionaryRepository}
                handwritingEvaluationPort={handwritingEvaluationPort}
                kanaCatalogRepository={kanaCatalogRepository}
                memoryHandwritingCollageService={memoryHandwritingCollageService}
                practiceSessionRepository={practiceSessionRepository}
                appUsageRepository={appUsageRepository}
                spanishToEnglishDictionaryRepository={spanishToEnglishDictionaryRepository}
                vocabularyDraftRepository={vocabularyDraftRepository}
                vocabularyRepository={vocabularyRepository}
                writingTemplateRepository={writingTemplateRepository}
              />
            </LanguageProvider>
          </AudioProvider>
        </UserSessionProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function SessionGate({
  dictionaryRepository,
  handwritingEvaluationPort,
  kanaCatalogRepository,
  memoryHandwritingCollageService,
  practiceSessionRepository,
  appUsageRepository,
  spanishToEnglishDictionaryRepository,
  vocabularyDraftRepository,
  vocabularyRepository,
  writingTemplateRepository,
}: {
  dictionaryRepository: ReturnType<typeof createDictionaryRepository>;
  handwritingEvaluationPort: ReturnType<typeof createHandwritingEvaluationPort>;
  kanaCatalogRepository: ReturnType<typeof createKanaCatalogRepository>;
  memoryHandwritingCollageService: SvgMemoryHandwritingCollageService;
  practiceSessionRepository: ReturnType<typeof createPracticeSessionRepository>;
  appUsageRepository: ReturnType<typeof createAppUsageRepository>;
  spanishToEnglishDictionaryRepository: LocalSpanishToEnglishDictionaryRepository;
  vocabularyDraftRepository: ReturnType<typeof createVocabularyDraftRepository>;
  vocabularyRepository: ReturnType<typeof createVocabularyRepository>;
  writingTemplateRepository: LocalWritingTemplateRepository;
}) {
  const { isAuthenticated, isLoading, loginWithPin } = useUserSession();

  if (isLoading && !isAuthenticated) {
    return <DataStateMessage label="Preparando tu sesión..." />;
  }

  if (!isAuthenticated) {
    return <PinLoginScreen isLoading={isLoading} onSubmit={(pin) => loginWithPin(pin, 'adri')} />;
  }

  return (
    <AppNavigator
      dictionaryRepository={dictionaryRepository}
      handwritingEvaluationPort={handwritingEvaluationPort}
      kanaCatalogRepository={kanaCatalogRepository}
      memoryHandwritingCollageService={memoryHandwritingCollageService}
      practiceSessionRepository={practiceSessionRepository}
      appUsageRepository={appUsageRepository}
      spanishToEnglishDictionaryRepository={spanishToEnglishDictionaryRepository}
      vocabularyDraftRepository={vocabularyDraftRepository}
      vocabularyRepository={vocabularyRepository}
      writingTemplateRepository={writingTemplateRepository}
    />
  );
}

function AppNavigator({
  dictionaryRepository,
  handwritingEvaluationPort,
  kanaCatalogRepository,
  memoryHandwritingCollageService,
  practiceSessionRepository,
  appUsageRepository,
  spanishToEnglishDictionaryRepository,
  vocabularyDraftRepository,
  vocabularyRepository,
  writingTemplateRepository,
}: {
  dictionaryRepository: ReturnType<typeof createDictionaryRepository>;
  handwritingEvaluationPort: ReturnType<typeof createHandwritingEvaluationPort>;
  kanaCatalogRepository: ReturnType<typeof createKanaCatalogRepository>;
  memoryHandwritingCollageService: SvgMemoryHandwritingCollageService;
  practiceSessionRepository: ReturnType<typeof createPracticeSessionRepository>;
  appUsageRepository: ReturnType<typeof createAppUsageRepository>;
  spanishToEnglishDictionaryRepository: LocalSpanishToEnglishDictionaryRepository;
  vocabularyDraftRepository: ReturnType<typeof createVocabularyDraftRepository>;
  vocabularyRepository: ReturnType<typeof createVocabularyRepository>;
  writingTemplateRepository: LocalWritingTemplateRepository;
}) {
  const [kanaSeries, setKanaSeries] = useState<KanaSeries[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(true);
  const { currentUser, refresh } = useUserSession();
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
    return (count: number, seriesId?: string, vocabularyItemId?: string) =>
      getVocabularyPracticeRound(vocabularyRepository, count, seriesId, vocabularyItemId);
  }, [vocabularyRepository]);
  const loadVocabulary = useMemo(() => {
    return () => vocabularyRepository.getAll();
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
  const recordPracticeSession = useMemo(() => {
    const useCase = new RecordPracticeSessionUseCase(practiceSessionRepository);

    return async (input: Parameters<RecordPracticeSessionUseCase['execute']>[0]) => {
      const result = await useCase.execute(input);

      if (result.success) {
        void refresh();
      }

      return result;
    };
  }, [practiceSessionRepository, refresh]);
  useAppUsageTracker(currentUser?.id, appUsageRepository);

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

  return (
    <Stack.Navigator
      initialRouteName="home"
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: styles.stackContent,
        gestureEnabled: false,
        headerShown: false,
      }}>
      <Stack.Screen name="home">
        {({ navigation }: ScreenProps<'home'>) => (
          <ScreenShell navigation={navigation}>
            <HomeScreen
              onOpenAddVocabulary={() => navigation.navigate('addVocabulary')}
              onOpenHiragana={() => navigation.navigate('hiraganaSeries')}
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="userProfile">
        {({ navigation }: ScreenProps<'userProfile'>) => (
          <ScreenShell isUserProfileRoute musicTrack="statistics" navigation={navigation}>
            <UserProfileScreen onBack={() => goBackOrHome(navigation)} showBackButton={showFallbackBackButton} />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="addVocabulary">
        {({ navigation }: ScreenProps<'addVocabulary'>) => (
          <ScreenShell navigation={navigation} showUserBadge={false}>
            <AddVocabularyFlowScreen
              createDraft={createVocabularyDraft}
              resolveKanaSeries={resolveKanaSeries}
              searchExternalCandidates={searchDictionaryCandidates.searchExternal}
              searchInitialCandidates={searchDictionaryCandidates.searchInitial}
              showBackButton={showFallbackBackButton}
              tokenizeKana={tokenizeKana}
              onBack={() => goBackOrHome(navigation)}
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="hiraganaSeries">
        {({ navigation }: ScreenProps<'hiraganaSeries'>) => (
          <ScreenShell navigation={navigation}>
            {isLoadingSeries || kanaSeries.length === 0 ? (
              <DataStateMessage label={isLoadingSeries ? 'Cargando series...' : 'No hay series disponibles'} />
            ) : (
              <HiraganaSeriesScreen
                series={kanaSeries}
                showBackButton={showFallbackBackButton}
                onBack={() => goBackOrHome(navigation)}
                onOpenMemory={() =>
                  navigation.navigate('memoryPracticeVariant', {
                    fromSeriesPractice: true,
                    series: createRandomKanaSeries(kanaSeries),
                  })
                }
                onOpenVocabulary={() => navigation.navigate('vocabularyGallery')}
                onSelectRandom={() =>
                  navigation.navigate('practiceModes', {
                    series: createRandomKanaSeries(kanaSeries),
                  })
                }
                onOpenSeriesPractice={() =>
                  navigation.navigate('seriesPractice', {
                    seriesId: kanaSeries[0]?.id ?? 'hiragana-vowels',
                  })
                }
              />
            )}
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="vocabularyGallery">
        {({ navigation }: ScreenProps<'vocabularyGallery'>) => (
          <ScreenShell navigation={navigation}>
            <VocabularyGalleryScreen
              loadVocabulary={loadVocabulary}
              series={kanaSeries}
              onOpenPractice={() => navigation.navigate('vocabularyPractice')}
              onSelectSeries={(selectedSeries, vocabulary) =>
                navigation.navigate('vocabularySeries', {
                  series: selectedSeries,
                  vocabulary,
                })
              }
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="vocabularySeries">
        {({ navigation, route }: ScreenProps<'vocabularySeries'>) => (
          <ScreenShell navigation={navigation} showUserBadge={false}>
            <VocabularySeriesScreen
              getRemoteImageUrl={getVocabularyImageUrl}
              series={route.params.series}
              vocabulary={route.params.vocabulary}
              onBack={() => goBackOrHome(navigation)}
              onOpenDetail={(initialIndex) =>
                navigation.navigate('vocabularyDetail', {
                  initialIndex,
                  series: route.params.series,
                  vocabulary: route.params.vocabulary,
                })
              }
              onPractice={() =>
                navigation.navigate('vocabularyPractice', {
                  seriesId: route.params.series.id,
                  seriesTitle: route.params.series.title,
                })
              }
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="vocabularyDetail">
        {({ navigation, route }: ScreenProps<'vocabularyDetail'>) => (
          <ScreenShell navigation={navigation} showUserBadge={false}>
            <VocabularyDetailScreen
              getRemoteImageUrl={getVocabularyImageUrl}
              initialIndex={route.params.initialIndex}
              series={route.params.series}
              vocabulary={route.params.vocabulary}
              onBack={() => goBackOrHome(navigation)}
              onPractice={(item) =>
                navigation.navigate('vocabularyPractice', {
                  seriesId: route.params.series.id,
                  seriesTitle: route.params.series.title,
                  vocabularyItemId: item.id,
                })
              }
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="seriesPractice">
        {({ navigation, route }: ScreenProps<'seriesPractice'>) => (
          <ScreenShell navigation={navigation} showUserBadge={false}>
            <SeriesPracticeRoute
              initialSeriesId={route.params.seriesId}
              navigation={navigation}
              practiceModes={practiceModes}
              seriesOptions={kanaSeries}
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="practiceModes">
        {({ navigation, route }: ScreenProps<'practiceModes'>) => (
          <ScreenShell navigation={navigation} showUserBadge={false}>
            <PracticeModeSelectionScreen
              practiceModes={practiceModes}
              series={route.params.series}
              showBackButton={showFallbackBackButton}
              onBack={() => goBackOrHome(navigation)}
              onSelectMode={(mode) => navigateToPracticeMode(navigation, mode, route.params.series)}
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="memoryPracticeVariant">
        {({ navigation, route }: ScreenProps<'memoryPracticeVariant'>) => (
          <ScreenShell navigation={navigation} showUserBadge={false}>
            <MemoryPracticeVariantSelectionScreen
              series={route.params.series}
              showBackButton={showFallbackBackButton}
              onBack={() => goBackOrHome(navigation)}
              onSelectVariant={(memoryPracticeVariant) =>
                navigation.navigate('writingPractice', {
                  fromSeriesPractice: route.params.fromSeriesPractice,
                  memoryPracticeVariant,
                  mode: 'memory',
                  series: route.params.series,
                })
              }
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="flashcards">
        {({ navigation, route }: ScreenProps<'flashcards'>) => (
          <ScreenShell navigation={navigation} showUserBadge={false}>
            <FlashcardScreen
              series={route.params.series}
              onBack={() => goBackOrHome(navigation)}
              onNextSeries={() =>
                navigation.replace('flashcards', {
                  series: getNextSeries(route.params.series, kanaSeries),
                })
              }
              onRepeatSeries={() =>
                navigation.replace('flashcards', {
                  series: getRepeatSeries(route.params.series, kanaSeries),
                })
              }
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="writingPractice">
        {({ navigation, route }: ScreenProps<'writingPractice'>) => (
          <ScreenShell
            enableShellSwipe={false}
            musicTrack="kanaWrite"
            navigation={navigation}
            showUserBadge={false}
          >
            <KanaWritingPracticeScreen
              evaluateMemoryHandwriting={evaluateMemoryHandwriting}
              generateMemoryHandwritingCollage={generateMemoryHandwritingCollage}
              getRemoteImageUrl={getVocabularyImageUrl}
              loadVocabularyByKana={loadVocabularyByKana}
              loadWritingTemplate={loadWritingTemplate}
              recordPracticeSession={currentUser
                ? (input) => recordPracticeSession({ ...input, userId: currentUser.id })
                : undefined}
              memoryPracticeVariant={route.params.memoryPracticeVariant}
              mode={route.params.mode}
              series={route.params.series}
              seriesId={route.params.series.id}
              seriesOptions={kanaSeries}
              showBackButton={showFallbackBackButton}
              onBack={() => goBackOrHome(navigation)}
              onNextSeries={() =>
                navigation.replace('writingPractice', {
                  ...route.params,
                  series: getNextSeries(route.params.series, kanaSeries),
                })
              }
              onRepeatSeries={() =>
                navigation.replace('writingPractice', {
                  ...route.params,
                  series: getRepeatSeries(route.params.series, kanaSeries),
                })
              }
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="romajiQuiz">
        {({ navigation, route }: ScreenProps<'romajiQuiz'>) => (
          <ScreenShell navigation={navigation} showUserBadge={false}>
            <RomajiQuizScreen
              getRemoteImageUrl={getVocabularyImageUrl}
              loadVocabularyByKana={loadVocabularyByKana}
              recordPracticeSession={currentUser
                ? (input) => recordPracticeSession({ ...input, userId: currentUser.id })
                : undefined}
              series={route.params.series}
              seriesId={route.params.series.id}
              showBackButton={showFallbackBackButton}
              onBack={() => goBackOrHome(navigation)}
              onNextSeries={() =>
                navigation.replace('romajiQuiz', {
                  ...route.params,
                  series: getNextSeries(route.params.series, kanaSeries),
                })
              }
              onRepeatSeries={() =>
                navigation.replace('romajiQuiz', {
                  ...route.params,
                  series: getRepeatSeries(route.params.series, kanaSeries),
                })
              }
            />
          </ScreenShell>
        )}
      </Stack.Screen>

      <Stack.Screen name="vocabularyPractice">
        {({ navigation, route }: ScreenProps<'vocabularyPractice'>) => (
          <ScreenShell navigation={navigation} showUserBadge={false}>
            <VocabularyPracticeScreen
              getRemoteImageUrl={getVocabularyImageUrl}
              loadPracticeRound={(count) =>
                loadVocabularyPracticeRound(
                  count,
                  route.params?.seriesId,
                  route.params?.vocabularyItemId,
                )
              }
              recordPracticeSession={currentUser
                ? (input) => recordPracticeSession({ ...input, userId: currentUser.id })
                : undefined}
              showBackButton={showFallbackBackButton}
              onBack={() => goBackOrHome(navigation)}
            />
          </ScreenShell>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function ScreenShell<RouteName extends keyof AppStackParamList>({
  children,
  enableShellSwipe = true,
  isUserProfileRoute = false,
  musicTrack = 'menuLoop',
  navigation,
  showUserBadge = true,
}: {
  children: ReactNode;
  enableShellSwipe?: boolean;
  isUserProfileRoute?: boolean;
  musicTrack?: MusicKey;
  navigation: NativeStackNavigationProp<AppStackParamList, RouteName>;
  showUserBadge?: boolean;
}) {
  const { currentUser } = useUserSession();
  const touchStartRef = useRef<{ pageX: number; pageY: number; time: number } | undefined>(undefined);

  useEffect(() => {
    return navigation.addListener('transitionStart', (event) => {
      if (event.data.closing) {
        playBackSound();
      }
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      playMusic(musicTrack, { loop: true });
    }, [musicTrack]),
  );

  return (
    <View
      style={styles.authenticatedShell}
      onTouchEnd={(event) => {
        if (!enableShellSwipe) {
          return;
        }

        handleShellSwipe(event, touchStartRef.current, {
          isUserProfileRoute,
          navigation,
        });
      }}
      onTouchStart={(event) => {
        touchStartRef.current = {
          pageX: event.nativeEvent.pageX,
          pageY: event.nativeEvent.pageY,
          time: Date.now(),
        };
      }}>
      {showUserBadge ? (
        <View style={styles.userBadgePosition}>
          <Pressable
            accessibilityLabel={isUserProfileRoute ? 'Volver' : 'Abrir perfil'}
            accessibilityRole="button"
            onPress={() => {
              playSound('tap');

              if (isUserProfileRoute) {
                goBackOrHome(navigation);
                return;
              }

              navigation.navigate('userProfile');
            }}
            style={({ pressed }) => [styles.userBadge, pressed ? styles.userBadgePressed : null]}>
            <Text style={styles.userBadgeLabel}>
              {isUserProfileRoute ? 'Volver' : `@${currentUser?.username ?? 'adri'}`}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {children}
    </View>
  );
}

function navigateToPracticeMode<RouteName extends keyof AppStackParamList>(
  navigation: NativeStackNavigationProp<AppStackParamList, RouteName>,
  mode: PracticeMode,
  series: KanaSeries,
  fromSeriesPractice?: boolean,
) {
  if (mode === 'romajiQuiz') {
    navigation.navigate('romajiQuiz', { fromSeriesPractice, series });
    return;
  }

  if (mode === 'vocabulary') {
    navigation.navigate('vocabularyPractice');
    return;
  }

  if (mode === 'memory') {
    navigation.navigate('memoryPracticeVariant', { fromSeriesPractice, series });
    return;
  }

  navigation.navigate('writingPractice', { fromSeriesPractice, mode, series });
}

function SeriesPracticeRoute({
  initialSeriesId,
  navigation,
  practiceModes,
  seriesOptions,
}: {
  initialSeriesId: string;
  navigation: NativeStackNavigationProp<AppStackParamList, 'seriesPractice'>;
  practiceModes: ReturnType<typeof getPracticeModes>;
  seriesOptions: KanaSeries[];
}) {
  const [selectedSeriesId, setSelectedSeriesId] = useState(initialSeriesId);
  const selectedSeries = getSeriesById(selectedSeriesId, seriesOptions);

  useEffect(() => {
    if (!seriesOptions.some((series) => series.id === selectedSeriesId)) {
      setSelectedSeriesId(initialSeriesId);
    }
  }, [initialSeriesId, selectedSeriesId, seriesOptions]);

  return (
    <PracticeModeSelectionScreen
      practiceModes={practiceModes}
      series={selectedSeries}
      seriesOptions={seriesOptions}
      showBackButton={showFallbackBackButton}
      onBack={() => goBackOrHome(navigation)}
      onSelectSeries={setSelectedSeriesId}
      onSelectMode={(mode) => navigateToPracticeMode(navigation, mode, selectedSeries, true)}
    />
  );
}

function goBackOrHome<RouteName extends keyof AppStackParamList>(
  navigation: NativeStackNavigationProp<AppStackParamList, RouteName>,
) {
  playBackSound();

  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  navigation.navigate('home');
}

function handleShellSwipe<RouteName extends keyof AppStackParamList>(
  event: GestureResponderEvent,
  start: { pageX: number; pageY: number; time: number } | undefined,
  {
    isUserProfileRoute,
    navigation,
  }: {
    isUserProfileRoute: boolean;
    navigation: NativeStackNavigationProp<AppStackParamList, RouteName>;
  },
) {
  if (!start) {
    return;
  }

  const dx = event.nativeEvent.pageX - start.pageX;
  const dy = event.nativeEvent.pageY - start.pageY;
  const elapsed = Date.now() - start.time;
  const isDeliberateHorizontalSwipe = Math.abs(dx) > 118 && Math.abs(dy) < 54 && elapsed < 700;

  if (!isDeliberateHorizontalSwipe) {
    return;
  }

  if (dx > 118 && start.pageX < 64) {
    goBackOrHome(navigation);
    return;
  }

  if (dx < -118 && !isUserProfileRoute) {
    playSound('popup');
    navigation.navigate('userProfile');
  }
}

function playBackSound() {
  const now = Date.now();

  if (now - lastBackSoundAt < 420) {
    return;
  }

  lastBackSoundAt = now;
  playSound('whoosh');
}

function useAppUsageTracker(
  userId: string | undefined,
  appUsageRepository: ReturnType<typeof createAppUsageRepository>,
) {
  const usageStartedAtRef = useRef<string | undefined>(undefined);
  const lastFlushAtRef = useRef<number | undefined>(undefined);
  const useCaseRef = useRef<RecordAppUsageUseCase | undefined>(undefined);

  useEffect(() => {
    useCaseRef.current = new RecordAppUsageUseCase(appUsageRepository);
  }, [appUsageRepository]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    usageStartedAtRef.current = new Date().toISOString();
    lastFlushAtRef.current = Date.now();

    const flushUsage = () => {
      const startedAt = usageStartedAtRef.current;
      const lastFlushAt = lastFlushAtRef.current;

      if (!startedAt || !lastFlushAt || !useCaseRef.current) {
        return;
      }

      const now = Date.now();
      const durationSeconds = Math.round((now - lastFlushAt) / 1000);

      if (durationSeconds < 20) {
        return;
      }

      const endedAt = new Date(now).toISOString();
      void useCaseRef.current.execute({
        userId,
        startedAt,
        endedAt,
        durationSeconds,
        source: 'foreground',
        metadata: {
          platform: Platform.OS,
        },
      });
      usageStartedAtRef.current = endedAt;
      lastFlushAtRef.current = now;
    };

    const interval = setInterval(flushUsage, 120000);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        usageStartedAtRef.current = new Date().toISOString();
        lastFlushAtRef.current = Date.now();
        return;
      }

      flushUsage();
    });

    return () => {
      flushUsage();
      clearInterval(interval);
      subscription.remove();
    };
  }, [userId]);
}

function getSeriesById(seriesId: string, series: KanaSeries[]) {
  return series.find((item) => item.id === seriesId) ?? series[0];
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
  gestureRoot: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  stackContent: {
    backgroundColor: colors.background,
  },
  authenticatedShell: {
    flex: 1,
  },
  userBadgePosition: {
    alignItems: 'flex-start',
    left: 14,
    position: 'absolute',
    top: 10,
    zIndex: 20,
  },
  userBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.92)',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    maxWidth: 156,
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
