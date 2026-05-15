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
import { colors } from '@/src/shared/constants/colors';

type WritingMode = Extract<PracticeMode, 'trace' | 'memory'>;

type AppRoute =
  | { name: 'home' }
  | { name: 'hiraganaSeries' }
  | { name: 'practiceModes'; series: KanaSeries }
  | { name: 'flashcards'; series: KanaSeries }
  | { name: 'writingPractice'; mode: WritingMode; series: KanaSeries }
  | { name: 'romajiQuiz'; series: KanaSeries };

export default function SingraKanaApp() {
  const [route, setRoute] = useState<AppRoute>({ name: 'home' });

  const hiraganaSeries = useMemo(() => {
    const repository = createLocalHiraganaRepository();
    return getHiraganaSeries(repository);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {route.name === 'home' ? (
        <HomeScreen onOpenHiragana={() => setRoute({ name: 'hiraganaSeries' })} />
      ) : null}

      {route.name === 'hiraganaSeries' ? (
        <HiraganaSeriesScreen
          series={hiraganaSeries}
          onBack={() => setRoute({ name: 'home' })}
          onSelectRandom={() => {
            const randomSeries = createRandomKanaSeries(hiraganaSeries);
            setRoute({ name: 'practiceModes', series: randomSeries });
          }}
          onSelectSeries={(seriesId) => {
            const selectedSeries = hiraganaSeries.find((series) => series.id === seriesId);

            if (selectedSeries) {
              setRoute({ name: 'practiceModes', series: selectedSeries });
            }
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

            setRoute({ name: 'writingPractice', mode, series: route.series });
          }}
        />
      ) : null}

      {route.name === 'flashcards' ? (
        <FlashcardScreen
          series={route.series}
          onBack={() => setRoute({ name: 'hiraganaSeries' })}
        />
      ) : null}

      {route.name === 'writingPractice' ? (
        <KanaWritingPracticeScreen
          mode={route.mode}
          series={route.series}
          seriesId={route.series.id}
          onBack={() => setRoute({ name: 'practiceModes', series: route.series })}
        />
      ) : null}

      {route.name === 'romajiQuiz' ? (
        <RomajiQuizScreen
          series={route.series}
          seriesId={route.series.id}
          onBack={() => setRoute({ name: 'practiceModes', series: route.series })}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
