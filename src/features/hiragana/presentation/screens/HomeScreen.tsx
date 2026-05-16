import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getMascotImage } from '@/src/shared/assets/imageRegistry';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { SelectableCard } from '@/src/shared/components/SelectableCard';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';
import { FloatingView } from '@/src/shared/motion/FloatingView';

type HomeScreenProps = {
  onOpenHiragana: () => void;
};

export function HomeScreen({ onOpenHiragana }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const singraHomeImage = getMascotImage('singraHome');
  const isWide = width >= 720;
  const mascotSize = isWide ? 260 : Math.min(160, Math.max(130, width * 0.38));
  const contentWidth = Math.min(Math.max(width - 48, 0), 760);
  const cardListWidth = Math.min(contentWidth, 560);
  const titleSize = isWide ? 44 : Math.min(38, Math.max(32, width * 0.09));

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={['仮', 'あ', '字']} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.motionFrame, { width: contentWidth }]}>
          <View
            style={[
              styles.hero,
              isWide ? styles.heroWide : styles.heroStacked,
              { width: contentWidth },
            ]}>
              <View style={styles.header}>
                {!singraHomeImage && (
                  <View style={styles.heroMark}>
                    <View style={styles.heroHalo}>
                      <Text style={styles.heroKana}>仮</Text>
                    </View>
                  </View>
                )}
                <Text style={[styles.title, { fontSize: titleSize }]}>Singra Kana</Text>
                <Text style={styles.subtitle}>Learn Japanese step by step</Text>
              </View>

            {singraHomeImage ? (
                <FloatingView>
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
                </FloatingView>
            ) : null}
          </View>

            <View style={[styles.cardList, { width: cardListWidth }]}>
              <SelectableCard
                index={0}
                title="Hiragana"
                subtitle="Start with the basic kana syllabary"
                onPress={onOpenHiragana}
              />
              <SelectableCard title="Katakana" subtitle="Coming later" disabled index={1} />
              <SelectableCard title="Kanji" subtitle="Coming later" disabled index={2} />
            </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: '100%',
    overflow: 'visible',
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
    zIndex: 1,
  },
  motionFrame: {
    alignItems: 'center',
    gap: 28,
    maxWidth: 760,
  },
  hero: {
    alignItems: 'center',
    maxWidth: 760,
  },
  heroWide: {
    flexDirection: 'row',
    gap: 34,
    justifyContent: 'center',
  },
  heroStacked: {
    flexDirection: 'column',
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
  },
});
