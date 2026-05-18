import { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import { createRandomKanaSeries } from '@/src/features/hiragana/application/useCases/createRandomKanaSeries';
import { getHiraganaSeries } from '@/src/features/hiragana/application/useCases/getHiraganaSeries';
import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';
import { createLocalHiraganaRepository } from '@/src/features/hiragana/infrastructure/repositories/localHiraganaRepository';
import { FlashcardScreen } from '@/src/features/hiragana/presentation/screens/FlashcardScreen';
import { HiraganaSeriesScreen } from '@/src/features/hiragana/presentation/screens/HiraganaSeriesScreen';
import { HomeScreen } from '@/src/features/hiragana/presentation/screens/HomeScreen';
import { KanaWritingPracticeScreen } from '@/src/features/hiragana/presentation/screens/KanaWritingPracticeScreen';
import { PracticeModeSelectionScreen } from '@/src/features/hiragana/presentation/screens/PracticeModeSelectionScreen';
import { RomajiQuizScreen } from '@/src/features/hiragana/presentation/screens/RomajiQuizScreen';
import { VocabularyPracticeScreen } from '@/src/features/hiragana/presentation/screens/VocabularyPracticeScreen';
import { colors } from '@/src/shared/constants/colors';
import { LanguageProvider } from '@/src/shared/i18n/useTranslation';
import { AnimatedRouteContainer } from '@/src/shared/motion/AnimatedRouteContainer';
import { MotionStyleSheet } from '@/src/shared/motion/MotionStyleSheet';

type WritingMode = Extract<PracticeMode, 'trace' | 'memory'>;

type AppRoute =
  | { name: 'home' }
  | { name: 'hiraganaSeries' }
  | { name: 'seriesPractice'; seriesId: string }
  | { name: 'practiceModes'; series: KanaSeries }
  | { name: 'flashcards'; series: KanaSeries }
  | { name: 'writingPractice'; mode: WritingMode; series: KanaSeries; fromSeriesPractice?: boolean }
  | { name: 'romajiQuiz'; series: KanaSeries; fromSeriesPractice?: boolean }
  | { name: 'vocabularyPractice' };

export default function SingraKanaApp() {
  const [route, setRoute] = useState<AppRoute>({ name: 'home' });

  const hiraganaSeries = useMemo(() => {
    const repository = createLocalHiraganaRepository();
    return getHiraganaSeries(repository);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LanguageProvider>
        <MotionStyleSheet />
        <AnimatedRouteContainer routeKey={getRouteKey(route)}>
          {route.name === 'home' ? (
            <HomeScreen onOpenHiragana={() => setRoute({ name: 'hiraganaSeries' })} />
          ) : null}

          {route.name === 'hiraganaSeries' ? (
            <HiraganaSeriesScreen
              series={hiraganaSeries}
              onBack={() => setRoute({ name: 'home' })}
              onOpenVocabulary={() => setRoute({ name: 'vocabularyPractice' })}
              onSelectRandom={() => {
                const randomSeries = createRandomKanaSeries(hiraganaSeries);
                setRoute({ name: 'practiceModes', series: randomSeries });
              }}
              onOpenSeriesPractice={() =>
                setRoute({ name: 'seriesPractice', seriesId: hiraganaSeries[0]?.id ?? 'vowels' })
              }
            />
          ) : null}

          {route.name === 'seriesPractice' ? (
            <PracticeModeSelectionScreen
              series={getSeriesById(route.seriesId, hiraganaSeries)}
              seriesOptions={hiraganaSeries}
              onBack={() => setRoute({ name: 'hiraganaSeries' })}
              onSelectSeries={(seriesId) => setRoute({ name: 'seriesPractice', seriesId })}
              onSelectMode={(mode) => {
                const selectedSeries = getSeriesById(route.seriesId, hiraganaSeries);

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
                  series: getNextSeries(route.series, hiraganaSeries),
                })
              }
              onRepeatSeries={() =>
                setRoute({
                  name: 'flashcards',
                  series: getRepeatSeries(route.series, hiraganaSeries),
                })
              }
            />
          ) : null}

          {route.name === 'writingPractice' ? (
            <KanaWritingPracticeScreen
              mode={route.mode}
              series={route.series}
              seriesId={route.series.id}
              onBack={() => setRoute(getPracticeBackRoute(route.series, route.fromSeriesPractice))}
              onNextSeries={() =>
                setRoute({
                  name: 'writingPractice',
                  mode: route.mode,
                  series: getNextSeries(route.series, hiraganaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
                })
              }
              onRepeatSeries={() =>
                setRoute({
                  name: 'writingPractice',
                  mode: route.mode,
                  series: getRepeatSeries(route.series, hiraganaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
                })
              }
            />
          ) : null}

          {route.name === 'romajiQuiz' ? (
            <RomajiQuizScreen
              series={route.series}
              seriesId={route.series.id}
              onBack={() => setRoute(getPracticeBackRoute(route.series, route.fromSeriesPractice))}
              onNextSeries={() =>
                setRoute({
                  name: 'romajiQuiz',
                  series: getNextSeries(route.series, hiraganaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
                })
              }
              onRepeatSeries={() =>
                setRoute({
                  name: 'romajiQuiz',
                  series: getRepeatSeries(route.series, hiraganaSeries),
                  fromSeriesPractice: route.fromSeriesPractice,
                })
              }
            />
          ) : null}

          {route.name === 'vocabularyPractice' ? (
            <VocabularyPracticeScreen onBack={() => setRoute({ name: 'hiraganaSeries' })} />
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

  if (currentIndex === -1) {
    return createRandomKanaSeries(series);
  }

  return series[(currentIndex + 1) % series.length];
}

function getRepeatSeries(currentSeries: KanaSeries, series: KanaSeries[]) {
  if (currentSeries.id === 'random') {
    return createRandomKanaSeries(series);
  }

  return currentSeries;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
