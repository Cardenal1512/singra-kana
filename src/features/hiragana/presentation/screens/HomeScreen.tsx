import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getMascotImage } from '@/src/shared/assets/imageRegistry';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { SelectableCard } from '@/src/shared/components/SelectableCard';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';

type HomeScreenProps = {
  onOpenHiragana: () => void;
};

export function HomeScreen({ onOpenHiragana }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const singraHomeImage = getMascotImage('singraHome');
  const isWide = width >= 720;
  const mascotSize = isWide ? 260 : Math.min(190, Math.max(150, width * 0.42));

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={['仮', 'あ', '字']} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, isWide ? styles.heroWide : styles.heroStacked]}>
          <View style={styles.header}>
            {!singraHomeImage && (
              <View style={styles.heroMark}>
                <View style={styles.heroHalo}>
                  <Text style={styles.heroKana}>仮</Text>
                </View>
              </View>
            )}
            <Text style={styles.title}>Singra Kana</Text>
            <Text style={styles.subtitle}>Learn Japanese step by step</Text>
          </View>

          {singraHomeImage ? (
            <View
              style={[
                styles.mascotShell,
                { height: mascotSize + 34, width: mascotSize + 34 },
              ]}>
              <View
                style={[
                  styles.mascotHalo,
                  { height: mascotSize + 18, width: mascotSize + 18 },
                ]}>
                <Image
                  accessibilityLabel="Singra, mascota de la app"
                  resizeMode="contain"
                  source={singraHomeImage}
                  style={{ height: mascotSize, width: mascotSize }}
                />
              </View>
            </View>
          ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    gap: 28,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    maxWidth: 760,
    width: '100%',
  },
  heroWide: {
    flexDirection: 'row',
    gap: 34,
    justifyContent: 'center',
  },
  heroStacked: {
    flexDirection: 'column-reverse',
    gap: 12,
  },
  header: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  heroMark: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroHalo: {
    alignItems: 'center',
    backgroundColor: pastelColors.orange,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 86,
    justifyContent: 'center',
    width: 86,
    ...softShadow,
  },
  heroKana: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 52,
  },
  mascotShell: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
  },
  mascotHalo: {
    alignItems: 'center',
    backgroundColor: pastelColors.yellow,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    ...softShadow,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
    textAlign: 'center',
  },
  cardList: {
    alignSelf: 'center',
    gap: 12,
    maxWidth: 560,
    width: '100%',
  },
});
