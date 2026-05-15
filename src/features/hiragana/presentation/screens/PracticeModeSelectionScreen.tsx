import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { PracticeMode } from '@/src/features/hiragana/domain/models/PracticeMode';
import type {
  PracticeModeConfig,
  PracticeModeId,
} from '@/src/features/hiragana/domain/models/PracticeModeConfig';
import { practiceModes } from '@/src/features/hiragana/infrastructure/data/practiceModes';
import { PracticeModeCard } from '@/src/features/hiragana/presentation/components/PracticeModeCard';
import { getModeImage } from '@/src/shared/assets/imageRegistry';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { useTranslation } from '@/src/shared/i18n/useTranslation';

type PracticeModeSelectionScreenProps = {
  series: KanaSeries;
  onBack: () => void;
  onSelectMode: (mode: PracticeMode) => void;
};

const screenPadding = 14;
const maxContentWidth = 900;
const gridGap = 12;
const minCardWidth = 158;

const modeAccentColors: Record<PracticeModeId, string> = {
  trace: '#F4D4A4',
  memory: '#F4E6A4',
  romaji: '#BFDCEF',
  words: '#BFE7D2',
  speed: '#F3B8AE',
  listening: '#D6CCF1',
};

export function PracticeModeSelectionScreen({
  series,
  onBack,
  onSelectMode,
}: PracticeModeSelectionScreenProps) {
  const { language, t } = useTranslation();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - screenPadding * 2, maxContentWidth);
  const columnCount = getColumnCount(contentWidth);
  const cardWidth = Math.floor((contentWidth - gridGap * (columnCount - 1)) / columnCount);
  const seriesLabel = getSeriesLabel(series, language);
  const title = formatTranslation(t.practiceModes.screenTitleSeries, { series: seriesLabel });
  const kanaLine = series.characters.map((character) => character.kana).join(' ');

  function handlePress(config: PracticeModeConfig) {
    if (!config.enabled || !config.mode) {
      return;
    }

    onSelectMode(config.mode);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <KawaiiBackground kana={['あ', 'か', 'ま']} />

      <View style={[styles.content, { width: contentWidth }]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{`← ${t.common.back}`}</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.kanaLine}>{kanaLine}</Text>
          <Text style={styles.subtitle}>{t.practiceModes.subtitle}</Text>
        </View>

        <View style={[styles.grid, { gap: gridGap }]}>
          {practiceModes.map((config) => {
            const copy = t.practiceModes[config.titleKey];

            return (
              <PracticeModeCard
                key={config.id}
                title={copy.title}
                description={copy.description}
                japaneseLabel={config.japaneseLabel}
                imageSource={getModeImage(config.imageKey)}
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

function getColumnCount(width: number) {
  if (width >= 720) {
    return 3;
  }

  if (width >= minCardWidth * 2 + gridGap) {
    return 2;
  }

  return 1;
}

function getSeriesLabel(series: KanaSeries, language: 'en' | 'es') {
  if (series.id === 'vowels') {
    return language === 'es' ? 'Vocales' : 'Vowels';
  }

  return series.title.replace(/ Series$/u, '');
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
    gap: 4,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  kanaLine: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
