import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import { playSound } from '@/src/shared/audio/AudioService';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useTranslation } from '@/src/shared/i18n/useTranslation';
import { EnterView } from '@/src/shared/motion/EnterView';
import { getCardEnterStyle, softTransition } from '@/src/shared/motion/motionStyles';
import { usePrefersReducedMotion } from '@/src/shared/motion/usePrefersReducedMotion';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type HiraganaSeriesScreenProps = {
  series: KanaSeries[];
  showBackButton?: boolean;
  onBack: () => void;
  onOpenMemory: () => void;
  onOpenVocabulary: () => void;
  onOpenSeriesPractice: () => void;
  onSelectRandom: () => void;
};

const screenPadding = 14;
const maxContentWidth = 900;
const cardGap = 12;

export function HiraganaSeriesScreen({
  series,
  showBackButton = true,
  onBack,
  onOpenMemory,
  onOpenVocabulary,
  onOpenSeriesPractice,
  onSelectRandom,
}: HiraganaSeriesScreenProps) {
  const { t } = useTranslation();
  const { isMobile, width } = useResponsiveLayout();
  const contentWidth = Math.min(width - screenPadding * 2, maxContentWidth);
  const columnCount = isMobile ? 1 : contentWidth >= 780 ? 3 : 2;
  const cardWidth = Math.floor((contentWidth - cardGap * (columnCount - 1)) / columnCount);
  const randomKanaCount = series.reduce((total, item) => total + item.characters.length, 0);

  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <KawaiiBackground kana={['\u3072', '\u3089', '\u306a']} />
      <View style={[styles.content, { width: contentWidth }]}>
        {showBackButton ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              playSound('tap');
              onBack();
            }}
            style={styles.backButton}>
            <Text style={styles.backText}>{`< ${t.common.back}`}</Text>
          </Pressable>
        ) : null}

        <View style={styles.header}>
          <Text style={styles.japaneseTitle}>{'\u3072\u3089\u304c\u306a'}</Text>
          <Text style={styles.title}>{t.hiragana.title}</Text>
          <Text style={styles.subtitle}>{t.hiragana.subtitle}</Text>
        </View>

        <View style={[styles.choiceGrid, isMobile ? styles.choiceGridStacked : null]}>
          <HiraganaChoiceCard
            index={0}
            kana={'\u8a18'}
            title="Modo memoria"
            subtitle="Recuerda y escribe kana sin pistas"
            width={cardWidth}
            onPress={onOpenMemory}
          />
          <HiraganaChoiceCard
            index={1}
            kana={'\u5217'}
            title="Modo series"
            subtitle={t.hiragana.seriesPracticeSubtitle}
            width={cardWidth}
            onPress={onOpenSeriesPractice}
          />
          <HiraganaChoiceCard
            index={2}
            kana={'\u8a00'}
            title="Modo vocabulario"
            subtitle={t.hiragana.vocabularySubtitle}
            width={cardWidth}
            onPress={onOpenVocabulary}
          />
          <HiraganaChoiceCard
            index={3}
            kana={'\u4e71'}
            title="Modo aleatorio"
            subtitle={formatTranslation(t.hiragana.randomSubtitle, {
              count: String(randomKanaCount),
            })}
            width={cardWidth}
            onPress={onSelectRandom}
          />
        </View>
      </View>
    </ScrollView>
  );
}

type HiraganaChoiceCardProps = {
  index: number;
  kana: string;
  title: string;
  subtitle: string;
  width: number;
  onPress: () => void;
};

function HiraganaChoiceCard({
  index,
  kana,
  title,
  subtitle,
  width,
  onPress,
}: HiraganaChoiceCardProps) {
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const handlePress = () => {
    playSound('tap');
    onPress();
  };

  return (
    <EnterView index={index} reducedMotion={prefersReducedMotion} style={{ width }}>
    <Pressable
      accessibilityRole="button"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.choiceCard,
        { width },
        getCardEnterStyle(index, prefersReducedMotion),
        hovered && !prefersReducedMotion ? styles.hovered : null,
        pressed && !prefersReducedMotion ? styles.pressed : null,
      ]}>
      <View style={styles.kanaBadge}>
        <Text style={styles.choiceKana}>{kana}</Text>
      </View>
      <View style={styles.choiceCopy}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
    </EnterView>
  );
}

function formatTranslation(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{{${key}}}`, value),
    template,
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: screenPadding,
    paddingTop: 8,
    position: 'relative',
  },
  content: {
    gap: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    gap: 0,
    marginBottom: 6,
  },
  japaneseTitle: {
    color: colors.ink,
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 62,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: cardGap,
    justifyContent: 'center',
  },
  choiceGridStacked: {
    flexDirection: 'column',
  },
  choiceCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    minHeight: 220,
    padding: 18,
    ...softShadow,
    ...softTransition,
  },
  kanaBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  choiceKana: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 52,
  },
  choiceCopy: {
    alignItems: 'center',
    gap: 6,
  },
  choiceTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  choiceSubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  hovered: {
    shadowOpacity: 0.15,
    shadowRadius: 24,
    transform: [{ translateY: -6 }, { scale: 1.015 }],
  },
});
