import { ScrollView, StyleSheet, View } from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';
import { ScreenHeader } from '@/src/features/hiragana/presentation/components/ScreenHeader';
import { SelectableCard } from '@/src/shared/components/SelectableCard';

type PracticeModeSelectionScreenProps = {
  series: KanaSeries;
  onBack: () => void;
  onSelectMode: (mode: PracticeMode) => void;
};

export function PracticeModeSelectionScreen({
  series,
  onBack,
  onSelectMode,
}: PracticeModeSelectionScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader
        title={series.title}
        subtitle="Choose a practice mode"
        onBack={onBack}
      />

      <View style={styles.list}>
        <SelectableCard
          title="Level 1: Trace with guide"
          subtitle="Copy each kana over a guide"
          onPress={() => onSelectMode('trace')}
        />
        <SelectableCard
          title="Level 2: Memory writing"
          subtitle="Write each kana without the guide"
          onPress={() => onSelectMode('memory')}
        />
        <SelectableCard
          title="Level 3: Romaji quiz"
          subtitle="Type the romaji for each kana"
          onPress={() => onSelectMode('romajiQuiz')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 28,
    padding: 24,
  },
  list: {
    gap: 12,
  },
});
