import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { KanaTokenizerService } from '@/src/features/hiragana/application/services/KanaTokenizerService';
import { CreateVocabularyDraftUseCase } from '@/src/features/hiragana/application/useCases/CreateVocabularyDraftUseCase';
import { createRandomKanaSeries } from '@/src/features/hiragana/application/useCases/createRandomKanaSeries';
import { GetKanaSeriesUseCase } from '@/src/features/hiragana/application/useCases/GetKanaSeriesUseCase';
import { GetVocabularyByKanaUseCase } from '@/src/features/hiragana/application/useCases/GetVocabularyByKanaUseCase';
import { GetWritingTemplateUseCase } from '@/src/features/hiragana/application/useCases/GetWritingTemplateUseCase';
import { getPracticeModes } from '@/src/features/hiragana/application/useCases/getPracticeModes';
import { getVocabularyPracticeRound } from '@/src/features/hiragana/application/useCases/getVocabularyPracticeRound';
import { GenerateVocabularyImagePromptUseCase } from '@/src/features/hiragana/application/useCases/GenerateVocabularyImagePromptUseCase';
import { GenerateVocabularyImageUseCase } from '@/src/features/hiragana/application/useCases/GenerateVocabularyImageUseCase';
import { ResolveKanaSeriesUseCase } from '@/src/features/hiragana/application/useCases/ResolveKanaSeriesUseCase';
import { SearchDictionaryCandidatesUseCase } from '@/src/features/hiragana/application/useCases/SearchDictionaryCandidatesUseCase';
import { TokenizeKanaUseCase } from '@/src/features/hiragana/application/useCases/TokenizeKanaUseCase';
import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';
import { createDictionaryRepository } from '@/src/features/hiragana/infrastructure/repositories/createDictionaryRepository';
import { createImageGenerationRepository } from '@/src/features/hiragana/infrastructure/repositories/createImageGenerationRepository';
import { createKanaCatalogRepository } from '@/src/features/hiragana/infrastructure/repositories/createKanaCatalogRepository';
import { createVocabularyDraftRepository } from '@/src/features/hiragana/infrastructure/repositories/createVocabularyDraftRepository';
import { createVocabularyRepository } from '@/src/features/hiragana/infrastructure/repositories/createVocabularyRepository';
import { LocalSpanishToEnglishDictionaryRepository } from '@/src/features/hiragana/infrastructure/repositories/LocalSpanishToEnglishDictionaryRepository';
import { LocalWritingTemplateRepository } from '@/src/features/hiragana/infrastructure/repositories/LocalWritingTemplateRepository';
import { AddVocabularyFlowScreen } from '@/src/features/hiragana/presentation/screens/AddVocabularyFlowScreen';
import { FlashcardScreen } from '@/src/features/hiragana/presentation/screens/FlashcardScreen';
import { HiraganaSeriesScreen } from '@/src/features/hiragana/presentation/screens/HiraganaSeriesScreen';
import { HomeScreen } from '@/src/features/hiragana/presentation/screens/HomeScreen';
import { KanaWritingPracticeScreen } from '@/src/features/hiragana/presentation/screens/KanaWritingPracticeScreen';
import { PracticeModeSelectionScreen } from '@/src/features/hiragana/presentation/screens/PracticeModeSelectionScreen';
import { RomajiQuizScreen } from '@/src/features/hiragana/presentation/screens/RomajiQuizScreen';
import { VocabularyPracticeScreen } from '@/src/features/hiragana/presentation/screens/VocabularyPracticeScreen';
import { getGeneratedVocabularyImageUrl } from '@/src/infrastructure/supabase/storage/getGeneratedVocabularyImageUrl';
import { getVocabularyImageUrl } from '@/src/infrastructure/supabase/storage/getVocabularyImageUrl';
import { colors } from '@/src/shared/constants/colors';
import { LanguageProvider } from '@/src/shared/i18n/useTranslation';
import { AnimatedRouteContainer } from '@/src/shared/motion/AnimatedRouteContainer';
import { MotionStyleSheet } from '@/src/shared/motion/MotionStyleSheet';

type WritingMode = Extract<PracticeMode, 'trace' | 'memory'>;

type AppRoute =
  | { name: 'home' }
  | { name: 'addVocabulary' }
  | { name: 'hiraganaSeries' }
  | { name: 'seriesPractice'; seriesId: string }
  | { name: 'practiceModes'; series: KanaSeries }
  | { name: 'flashcards'; series: KanaSeries }
  | { name: 'writingPractice'; mode: WritingMode; series: KanaSeries; fromSeriesPractice?: boolean }
  | { name: 'romajiQuiz'; series: KanaSeries; fromSeriesPractice?: boolean }
  | { name: 'vocabularyPractice' };

export default function SingraKanaApp() {
  const [route, setRoute] = useState<AppRoute>({ name: 'home' });
  const [kanaSeries, setKanaSeries] = useState<KanaSeries[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(true);

  const kanaCatalogRepository = useMemo(() => createKanaCatalogRepository(), []);
  const dictionaryRepository = useMemo(() => createDictionaryRepository(), []);
  const imageGenerationRepository = useMemo(() => createImageGenerationRepository(), []);
  const spanishToEnglishDictionaryRepository = useMemo(
    () => new LocalSpanishToEnglishDictionaryRepository(),
    [],
  );
  const vocabularyRepository = useMemo(() => createVocabularyRepository(), []);
  const vocabularyDraftRepository = useMemo(() => createVocabularyDraftRepository(), []);
  const writingTemplateRepository = useMemo(() => new LocalWritingTemplateRepository(), []);
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
  const generateVocabularyImagePrompt = useMemo(() => {
    const useCase = new GenerateVocabularyImagePromptUseCase();
    return useCase.execute.bind(useCase);
  }, []);
  const generateVocabularyImage = useMemo(() => {
    const useCase = new GenerateVocabularyImageUseCase(imageGenerationRepository);
    return useCase.execute.bind(useCase);
  }, [imageGenerationRepository]);
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
    <SafeAreaView style={styles.container}>
      <LanguageProvider>
        <MotionStyleSheet />
        <AnimatedRouteContainer routeKey={getRouteKey(route)}>
          {route.name === 'home' ? (
            <HomeScreen
              onOpenAddVocabulary={() => setRoute({ name: 'addVocabulary' })}
              onOpenHiragana={() => setRoute({ name: 'hiraganaSeries' })}
            />
          ) : null}

          {route.name === 'addVocabulary' ? (
            <AddVocabularyFlowScreen
              createDraft={createVocabularyDraft}
              generateImage={generateVocabularyImage}
              generateImagePrompt={generateVocabularyImagePrompt}
              getGeneratedImageUrl={getGeneratedVocabularyImageUrl}
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

                setRoute({ name: 'writingPractice', mode, series: route.series });
              }}
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
              getRemoteImageUrl={getVocabularyImageUrl}
              loadWritingTemplate={loadWritingTemplate}
              loadVocabularyByKana={loadVocabularyByKana}
              seriesOptions={kanaSeries}
              mode={route.mode}
              series={route.series}
              seriesId={route.series.id}
              onBack={() => setRoute(getPracticeBackRoute(route.series, route.fromSeriesPractice))}
              onNextSeries={() =>
                setRoute({
                  name: 'writingPractice',
                  mode: route.mode,
                  series: getNextSeries(route.series, kanaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
                })
              }
              onRepeatSeries={() =>
                setRoute({
                  name: 'writingPractice',
                  mode: route.mode,
                  series: getRepeatSeries(route.series, kanaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
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
      </LanguageProvider>
    </SafeAreaView>
  );
}

function getRouteKey(route: AppRoute) {
  if (route.name === 'writingPractice') {
    return `${route.name}-${getSeriesRouteKey(route.series)}-${route.mode}`;
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
