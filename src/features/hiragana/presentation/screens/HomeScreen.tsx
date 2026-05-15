import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SelectableCard } from '@/src/shared/components/SelectableCard';
import { colors } from '@/src/shared/constants/colors';

type HomeScreenProps = {
  onOpenHiragana: () => void;
};

export function HomeScreen({ onOpenHiragana }: HomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.seal}>
          <Text style={styles.sealText}>仮</Text>
        </View>
        <Text style={styles.title}>Singra Kana</Text>
        <Text style={styles.subtitle}>Learn Japanese step by step</Text>
      </View>

      <View style={styles.cardList}>
        <SelectableCard
          title="Hiragana"
          subtitle="Start with the basic kana syllabary"
          onPress={onOpenHiragana}
        />
        <SelectableCard title="Katakana" subtitle="Coming later" disabled />
        <SelectableCard title="Kanji" subtitle="Coming later" disabled />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 28,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    gap: 10,
  },
  seal: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    marginBottom: 2,
    width: 42,
  },
  sealText: {
    color: colors.onPrimary,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 30,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 18,
    lineHeight: 25,
  },
  cardList: {
    gap: 12,
  },
});
