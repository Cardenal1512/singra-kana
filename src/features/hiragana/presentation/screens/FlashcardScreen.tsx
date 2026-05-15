import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import { ScreenHeader } from '@/src/features/hiragana/presentation/components/ScreenHeader';
import { AppButton } from '@/src/shared/components/AppButton';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';

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
    <View style={styles.root}>
      <KawaiiBackground kana={['ふ', currentCard.kana, 'ん']} />
      <View style={styles.content}>
        <ScreenHeader title={series.title} subtitle="Flashcards" onBack={onBack} />

        <View style={styles.flashcard}>
          <View style={styles.kanaHalo}>
            <Text style={styles.kana}>{currentCard.kana}</Text>
          </View>
          <Text style={styles.romaji}>{currentCard.romaji}</Text>
          <Text style={styles.counter}>
            {currentIndex + 1} / {series.characters.length}
          </Text>
        </View>

        <AppButton label="Next" onPress={goToNextCard} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: 22,
    justifyContent: 'space-between',
    padding: 24,
  },
  flashcard: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.panel,
    borderWidth: 1,
    gap: 14,
    justifyContent: 'center',
    maxWidth: 560,
    minHeight: 330,
    padding: 24,
    width: '100%',
    ...softShadow,
  },
  kanaHalo: {
    alignItems: 'center',
    backgroundColor: pastelColors.yellow,
    borderRadius: radii.pill,
    height: 186,
    justifyContent: 'center',
    width: 186,
  },
  kana: {
    color: colors.text,
    fontSize: 112,
    fontWeight: '800',
    lineHeight: 132,
  },
  romaji: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '900',
  },
  counter: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '800',
  },
});
