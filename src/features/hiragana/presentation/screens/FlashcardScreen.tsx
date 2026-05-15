import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import { ScreenHeader } from '@/src/features/hiragana/presentation/components/ScreenHeader';
import { AppButton } from '@/src/shared/components/AppButton';
import { colors } from '@/src/shared/constants/colors';

type FlashcardScreenProps = {
  series: KanaSeries;
  onBack: () => void;
};

export function FlashcardScreen({ series, onBack }: FlashcardScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentCard = series.characters[currentIndex];

  function goToNextCard() {
    setCurrentIndex((index) => (index + 1) % series.characters.length);
  }

  return (
    <View style={styles.content}>
      <ScreenHeader title={series.title} subtitle="Flashcards" onBack={onBack} />

      <View style={styles.flashcard}>
        <Text style={styles.kana}>{currentCard.kana}</Text>
        <Text style={styles.romaji}>{currentCard.romaji}</Text>
        <Text style={styles.counter}>
          {currentIndex + 1} / {series.characters.length}
        </Text>
      </View>

      <AppButton label="Next" onPress={goToNextCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 28,
    justifyContent: 'space-between',
    padding: 24,
  },
  flashcard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    justifyContent: 'center',
    minHeight: 320,
    padding: 24,
  },
  kana: {
    color: colors.text,
    fontSize: 112,
    fontWeight: '800',
  },
  romaji: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '800',
  },
  counter: {
    color: colors.mutedText,
    fontSize: 14,
  },
});
