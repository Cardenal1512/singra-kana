import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';
import type {
  PracticeModeConfig,
  PracticeModeId,
} from '@/src/features/hiragana/domain/models/PracticeModeConfig';
import { PracticeModeCard } from '@/src/features/hiragana/presentation/components/PracticeModeCard';
import { getMascotImage, getModeImage } from '@/src/shared/assets/imageRegistry';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii } from '@/src/shared/constants/visualSystem';
import { useTranslation } from '@/src/shared/i18n/useTranslation';
import { FloatingView } from '@/src/shared/motion/FloatingView';
import { softTransition } from '@/src/shared/motion/motionStyles';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type PracticeModeSelectionScreenProps = {
  practiceModes: PracticeModeConfig[];
  series: KanaSeries;
  seriesOptions?: KanaSeries[];
  onBack: () => void;
  onSelectSeries?: (seriesId: string) => void;
  onSelectMode: (mode: PracticeMode) => void;
};

const maxContentWidth = 980;
const gridGap = 18;
const minCardWidth = 188;

const modeAccentColors: Record<PracticeModeId, string> = {
  trace: '#F4D4A4',
  memory: '#F4E6A4',
  romaji: '#BFDCEF',
  words: '#BFE7D2',
  speed: '#F3B8AE',
  listening: '#D6CCF1',
};

export function PracticeModeSelectionScreen({
  practiceModes,
  series,
  seriesOptions,
  onBack,
  onSelectSeries,
  onSelectMode,
}: PracticeModeSelectionScreenProps) {
  const { language, t } = useTranslation();
  const { isDesktop, isMobile, isTablet, width } = useResponsiveLayout();
  const screenPadding = isMobile ? 14 : 24;
  const contentWidth = Math.min(width - screenPadding * 2, maxContentWidth);
  const columnCount = getColumnCount(contentWidth);
  const cardWidth = Math.floor((contentWidth - gridGap * (columnCount - 1)) / columnCount);
  const seriesLabel = getSeriesLabel(series, language);
  const title = formatTranslation(t.practiceModes.screenTitleSeries, { series: seriesLabel });
  const kanaRows = chunkKanaRows(
    series.characters.map((character) => character.kana),
    getSeriesBaseId(series.id) === 'dakuten' ? 10 : Number.POSITIVE_INFINITY,
  );
  const singraImage = getMascotImage('singraGambate') ?? getMascotImage('singraHome');
  const showHeaderMascot = !isMobile && contentWidth >= 700;
  const singraSize = isDesktop ? 108 : isTablet ? 82 : 0;

  function handlePress(config: PracticeModeConfig) {
    if (!config.enabled || !config.mode) {
      return;
    }

    onSelectMode(config.mode);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <KawaiiBackground kana={['あ', 'か', 'ま']} />

      <View style={[styles.content, { width: contentWidth }]}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>{`← ${t.common.back}`}</Text>
          </Pressable>
        </View>

        <View style={styles.heroArea}>
          {singraImage && showHeaderMascot ? (
            <View
              style={[
                styles.singraMascotSlot,
                isDesktop ? styles.singraMascotSlotDesktop : null,
                isTablet ? styles.singraMascotSlotTablet : null,
                { height: singraSize, width: singraSize },
              ]}>
              <FloatingView>
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="contain"
                  source={singraImage}
                  style={{ height: singraSize, width: singraSize }}
                />
              </FloatingView>
            </View>
          ) : null}

          <View
            style={[
              styles.headerFrame,
              isMobile ? styles.headerMobile : null,
            ]}>
            <View style={styles.header}>
              <Text style={[styles.title, isMobile ? styles.titleMobile : null]}>{title}</Text>
              <View style={styles.titleUnderline} />
              <View style={styles.kanaRows}>
                {kanaRows.map((kanaRow, index) => (
                  <Text
                    key={`${series.id}-kana-row-${index}`}
                    style={[
                      styles.kanaLine,
                      getSeriesBaseId(series.id) === 'dakuten' ? styles.kanaLineDense : null,
                      isMobile ? styles.kanaLineMobile : null,
                    ]}>
                    {kanaRow.join(' ')}
                  </Text>
                ))}
              </View>
              <Text style={styles.subtitle}>{t.practiceModes.subtitle}</Text>
            </View>
          </View>

          {seriesOptions && onSelectSeries ? (
            <SeriesSelector
              activeSeriesId={series.id}
              language={language}
              seriesOptions={seriesOptions}
              onSelectSeries={onSelectSeries}
            />
          ) : null}

          <View style={styles.modeSeparator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorMark}>さくら</Text>
            <View style={styles.separatorLine} />
          </View>
        </View>

        <View style={[styles.grid, { gap: gridGap }]}>
          {practiceModes.map((config, index) => {
            const copy = t.practiceModes[config.titleKey];

            return (
              <PracticeModeCard
                key={config.id}
                title={copy.title}
                description={copy.description}
                japaneseLabel={config.japaneseLabel}
                imageSource={getModeImage(config.imageKey)}
                index={index}
                accentColor={modeAccentColors[config.id]}
                disabled={!config.enabled}
                comingSoonLabel={t.common.comingSoon}
                width={cardWidth}
                onPress={() => handlePress(config)}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

type SeriesSelectorProps = {
  activeSeriesId: string;
  language: 'en' | 'es';
  seriesOptions: KanaSeries[];
  onSelectSeries: (seriesId: string) => void;
};

function SeriesSelector({
  activeSeriesId,
  language,
  seriesOptions,
  onSelectSeries,
}: SeriesSelectorProps) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.seriesSelector}
      showsHorizontalScrollIndicator={false}>
      {seriesOptions.map((item) => {
        const active = item.id === activeSeriesId;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelectSeries(item.id)}
            style={[styles.seriesChip, active ? styles.seriesChipActive : null]}>
            <Text style={[styles.seriesCardTitle, active ? styles.seriesCardTitleActive : null]}>
              {getSeriesShortLabel(item, language)}
            </Text>
            <Text style={[styles.seriesCardKana, active ? styles.seriesCardTextActive : null]}>
              {getSeriesJapaneseLabel(item)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function getColumnCount(width: number) {
  if (width >= 820) {
    return 3;
  }

  if (width >= minCardWidth * 2 + gridGap) {
    return 2;
  }

  return 1;
}

function getSeriesLabel(series: KanaSeries, language: 'en' | 'es') {
  if (getSeriesBaseId(series.id) === 'vowels') {
    return language === 'es' ? 'Vocales' : 'Vowels';
  }

  return series.title.replace(/ Series$/u, '');
}

function getSeriesShortLabel(series: KanaSeries, language: 'en' | 'es') {
  const seriesId = getSeriesBaseId(series.id);

  if (seriesId === 'vowels') {
    return 'A';
  }

  if (seriesId === 'dakuten') {
    return '゛';
  }

  if (seriesId === 'handakuten') {
    return '゜';
  }

  return series.title.replace(/ Series$/u, '');
}

function getSeriesJapaneseLabel(series: KanaSeries) {
  const labels: Record<string, string> = {
    vowels: 'あいうえお',
    'k-series': 'か行',
    's-series': 'さ行',
    't-series': 'た行',
    'n-series': 'な行',
    'h-series': 'は行',
    'm-series': 'ま行',
    'y-series': 'や行',
    'r-series': 'ら行',
    'w-series': 'わ行',
    dakuten: 'が行',
    handakuten: 'ぱ行',
  };

  return labels[getSeriesBaseId(series.id)] ?? series.representativeKana;
}

function getSeriesBaseId(seriesId: string) {
  return seriesId.replace(/^(hiragana|katakana|kanji)-/u, '');
}

function formatTranslation(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function chunkKanaRows(kana: string[], rowSize: number) {
  if (!Number.isFinite(rowSize) || kana.length <= rowSize) {
    return [kana];
  }

  const rows: string[][] = [];

  for (let index = 0; index < kana.length; index += rowSize) {
    rows.push(kana.slice(index, index + rowSize));
  }

  return rows;
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
    paddingHorizontal: 14,
    paddingTop: 10,
    position: 'relative',
  },
  content: {
    gap: 22,
  },
  topBar: {
    alignItems: 'flex-start',
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
  heroArea: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: 18,
    maxWidth: 940,
    position: 'relative',
    width: '100%',
  },
  singraMascotSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.82,
    position: 'absolute',
    right: 42,
    top: 10,
    zIndex: 2,
  },
  singraMascotSlotDesktop: {
    right: 54,
    top: 8,
  },
  singraMascotSlotTablet: {
    right: 34,
    top: 18,
  },
  headerFrame: {
    alignItems: 'center',
    maxWidth: 560,
    paddingHorizontal: 18,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  headerMobile: {
    maxWidth: 360,
    paddingHorizontal: 18,
  },
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  titleMobile: {
    fontSize: 26,
    lineHeight: 32,
  },
  titleUnderline: {
    backgroundColor: pastelColors.coral,
    borderRadius: radii.pill,
    height: 4,
    opacity: 0.72,
    width: 56,
  },
  kanaRows: {
    alignItems: 'center',
    gap: 2,
  },
  kanaLine: {
    color: colors.ink,
    fontSize: 43,
    fontWeight: '900',
    lineHeight: 52,
    textAlign: 'center',
  },
  kanaLineDense: {
    fontSize: 36,
    lineHeight: 43,
  },
  kanaLineMobile: {
    fontSize: 35,
    lineHeight: 43,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  seriesSelector: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 0,
    paddingHorizontal: 2,
    paddingTop: 0,
  },
  seriesChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.62)',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...softTransition,
  },
  seriesChipActive: {
    backgroundColor: '#F8ECEA',
    borderColor: colors.primary,
  },
  seriesCardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
    textAlign: 'center',
  },
  seriesCardTitleActive: {
    color: colors.primary,
  },
  seriesCardKana: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    textAlign: 'center',
  },
  seriesCardTextActive: {
    color: colors.text,
  },
  modeSeparator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    maxWidth: 440,
    opacity: 0.72,
    width: '68%',
  },
  separatorLine: {
    backgroundColor: colors.borderStrong,
    borderRadius: radii.pill,
    flex: 1,
    height: 1,
  },
  separatorMark: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  grid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
