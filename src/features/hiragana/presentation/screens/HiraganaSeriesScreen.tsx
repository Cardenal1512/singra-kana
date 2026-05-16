import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { useTranslation } from '@/src/shared/i18n/useTranslation';
import { getCardEnterStyle, softTransition } from '@/src/shared/motion/motionStyles';
import { usePrefersReducedMotion } from '@/src/shared/motion/usePrefersReducedMotion';

type HiraganaSeriesScreenProps = {
  series: KanaSeries[];
  onBack: () => void;
  onSelectRandom: () => void;
  onSelectSeries: (seriesId: string) => void;
};

const columnCount = 3;
const screenPadding = 14;
const cellGap = 8;
const maxGridWidth = 620;

export function HiraganaSeriesScreen({
  series,
  onBack,
  onSelectRandom,
  onSelectSeries,
}: HiraganaSeriesScreenProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const gridWidth = Math.min(width - screenPadding * 2, maxGridWidth);
  const cellSize = Math.floor((gridWidth - cellGap * (columnCount - 1)) / columnCount);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <KawaiiBackground kana={['ひ', 'ら', 'な']} />
      <View style={[styles.content, { width: gridWidth }]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{`← ${t.common.back}`}</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.japaneseTitle}>ひらがな</Text>
          <Text style={styles.title}>{t.hiragana.title}</Text>
          <Text style={styles.subtitle}>{t.hiragana.subtitle}</Text>
        </View>

        <WideTile
          title="MODO RANDOM"
          subtitle="10 random kana"
          representativeKana="乱"
          index={0}
          onPress={onSelectRandom}
        />

        <View style={styles.grid}>
          {series.map((item, index) => (
            <SeriesTile
              key={item.id}
              index={index + 1}
              series={item}
              size={cellSize}
              onPress={() => onSelectSeries(item.id)}
            />
          ))}
        </View>

        <WideTile
          title="WORDS"
          subtitle="Coming soon"
          representativeKana="言"
          disabled
          index={series.length + 1}
        />
      </View>
    </ScrollView>
  );
}

type SeriesTileProps = {
  index: number;
  series: KanaSeries;
  size: number;
  onPress: () => void;
};

function SeriesTile({ index, series, size, onPress }: SeriesTileProps) {
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          height: size,
          width: size,
        },
        getCardEnterStyle(index, prefersReducedMotion),
        hovered && !prefersReducedMotion ? styles.hovered : null,
        pressed && !prefersReducedMotion ? styles.pressed : null,
      ]}>
      <Text style={styles.kana}>{series.representativeKana}</Text>
      <View style={styles.tileText}>
        <Text numberOfLines={1} style={styles.tileTitle}>
          {series.title}
        </Text>
        {series.subtitle ? (
          <Text numberOfLines={1} style={styles.tileSubtitle}>
            {series.subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

type WideTileProps = {
  title: string;
  subtitle: string;
  representativeKana: string;
  index: number;
  disabled?: boolean;
  onPress?: () => void;
};

function WideTile({
  title,
  subtitle,
  representativeKana,
  index,
  disabled = false,
  onPress,
}: WideTileProps) {
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wideTile,
        getCardEnterStyle(index, prefersReducedMotion),
        disabled ? styles.disabledTile : null,
        hovered && !disabled && !prefersReducedMotion ? styles.hovered : null,
        pressed && !disabled && !prefersReducedMotion ? styles.pressed : null,
      ]}>
      <Text style={[styles.wideKana, disabled ? styles.disabledText : null]}>
        {representativeKana}
      </Text>
      <View style={styles.wideText}>
        <Text style={[styles.wideTitle, disabled ? styles.disabledText : null]}>{title}</Text>
        <Text style={[styles.wideSubtitle, disabled ? styles.disabledText : null]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    alignItems: 'center',
    padding: screenPadding,
    paddingTop: 8,
    position: 'relative',
  },
  content: {
    gap: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
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
    marginBottom: 4,
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
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: cellGap,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 1,
    ...softTransition,
  },
  kana: {
    color: colors.ink,
    fontSize: 39,
    fontWeight: '700',
    lineHeight: 47,
  },
  tileText: {
    alignItems: 'center',
    gap: 1,
    marginTop: 2,
  },
  tileTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  tileSubtitle: {
    color: colors.mutedText,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  wideTile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 1,
    ...softTransition,
  },
  wideKana: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
    width: 44,
  },
  wideText: {
    flex: 1,
    gap: 2,
  },
  wideTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  wideSubtitle: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
  },
  disabledTile: {
    backgroundColor: colors.disabledSurface,
    opacity: 0.72,
  },
  disabledText: {
    color: colors.disabledText,
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
