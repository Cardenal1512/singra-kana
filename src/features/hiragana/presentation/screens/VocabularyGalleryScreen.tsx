import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import { getMascotImage } from '@/src/shared/assets/imageRegistry';
import { playSound } from '@/src/shared/audio/AudioService';
import { AnimatedSingra } from '@/src/shared/components/AnimatedSingra';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type VocabularyGalleryScreenProps = {
  loadVocabulary: () => Promise<VocabularyItem[]>;
  series: KanaSeries[];
  onOpenPractice: () => void;
  onSelectSeries: (series: KanaSeries, vocabulary: VocabularyItem[]) => void;
};

type GalleryTab = 'hiragana' | 'katakana' | 'kanji';

type VocabularySeriesProgress = {
  series: KanaSeries;
  totalWords: number;
  learnedWords: number;
  vocabulary: VocabularyItem[];
  locked: boolean;
};

const totalVocabularyGoal = 120;

export function VocabularyGalleryScreen({
  loadVocabulary,
  onOpenPractice,
  onSelectSeries,
  series,
}: VocabularyGalleryScreenProps) {
  const { isMobile, width } = useResponsiveLayout();
  const [activeTab, setActiveTab] = useState<GalleryTab>('hiragana');
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCollection, setShowCollection] = useState(false);
  const contentWidth = Math.min(width - (isMobile ? 28 : 48), 820);
  const singraStudy = getMascotImage('singraStudy') ?? getMascotImage('singraSearch');
  const filteredSeries = useMemo(
    () => series.filter((item) => item.syllabary === activeTab),
    [activeTab, series],
  );
  const filteredVocabulary = useMemo(
    () => vocabulary.filter((item) => item.kanaSystem === activeTab || item.writingSystem === activeTab),
    [activeTab, vocabulary],
  );
  const seriesProgress = useMemo(
    () => buildSeriesProgress(filteredSeries, filteredVocabulary),
    [filteredSeries, filteredVocabulary],
  );
  const learnedWords = filteredVocabulary.filter((item) => item.isActive).length;
  const progressPercent = getProgressPercent(learnedWords, totalVocabularyGoal);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const items = await loadVocabulary();

        if (isMounted) {
          setVocabulary(items.filter((item) => item.approved && item.isActive));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [loadVocabulary]);

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={['ことば', '本', '学']} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.headerCard}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Galería</Text>
              <Text style={styles.subtitle}>Explora el vocabulario que has aprendido</Text>
            </View>
            {singraStudy ? (
              <View style={styles.headerMascot}>
                <AnimatedSingra mood="thinking" size={86} source={singraStudy} />
              </View>
            ) : null}
          </View>

          <SegmentedControl activeTab={activeTab} onChange={setActiveTab} />

          <CollectionSummaryCard
            learnedWords={learnedWords}
            progressPercent={progressPercent}
            totalWords={totalVocabularyGoal}
            onOpenCollection={() => setShowCollection((visible) => !visible)}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              playSound('tap');
              onOpenPractice();
            }}
            style={styles.randomPracticeButton}>
            <Text style={styles.randomPracticeButtonText}>Practicar palabras aleatorias</Text>
          </Pressable>

          {showCollection ? (
            <VocabularyCollectionPanel vocabulary={filteredVocabulary} />
          ) : null}

          <View style={styles.seriesList}>
            {isLoading ? (
              <Text style={styles.stateText}>Cargando vocabulario...</Text>
            ) : seriesProgress.length > 0 ? (
              seriesProgress.map((item) => (
                <VocabularySeriesCard
                  key={item.series.id}
                  item={item}
                  onPress={() => {
                    if (item.locked) {
                      return;
                    }

                    playSound('tap');
                    onSelectSeries(item.series, item.vocabulary);
                  }}
                />
              ))
            ) : (
              <Text style={styles.stateText}>Todavía no hay series disponibles.</Text>
            )}
          </View>

          <View style={styles.footerCard}>
            {singraStudy ? (
              <View style={styles.footerMascot}>
                <AnimatedSingra mood="happy" size={58} source={singraStudy} />
              </View>
            ) : null}
            <View style={styles.footerCopy}>
              <Text style={styles.footerTitle}>¡Sigue aprendiendo!</Text>
              <Text style={styles.footerSubtitle}>
                Practica más para desbloquear nuevas palabras.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SegmentedControl({
  activeTab,
  onChange,
}: {
  activeTab: GalleryTab;
  onChange: (tab: GalleryTab) => void;
}) {
  const tabs: GalleryTab[] = ['hiragana', 'katakana', 'kanji'];

  return (
    <View style={styles.segmentedControl}>
      {tabs.map((tab) => {
        const active = activeTab === tab;

        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              playSound('tap');
              onChange(tab);
            }}
            style={[styles.segment, active ? styles.segmentActive : null]}>
            <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
              {capitalize(tab)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CollectionSummaryCard({
  learnedWords,
  onOpenCollection,
  progressPercent,
  totalWords,
}: {
  learnedWords: number;
  onOpenCollection: () => void;
  progressPercent: number;
  totalWords: number;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.collectionIcon}>
        <Text style={styles.collectionIconText}>本</Text>
      </View>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryTitle}>Tu colección</Text>
        <Text style={styles.summaryValue}>{learnedWords} / {totalWords} palabras</Text>
        <ProgressBar percent={progressPercent} />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          playSound('tap');
          onOpenCollection();
        }}
        style={styles.progressButton}>
        <Text style={styles.progressButtonText}>Ver progreso</Text>
      </Pressable>
    </View>
  );
}

function VocabularyCollectionPanel({ vocabulary }: { vocabulary: VocabularyItem[] }) {
  if (vocabulary.length === 0) {
    return (
      <View style={styles.collectionPanel}>
        <Text style={styles.stateText}>Todavía no hay palabras desbloqueadas.</Text>
      </View>
    );
  }

  return (
    <View style={styles.collectionPanel}>
      <Text style={styles.collectionPanelTitle}>Todas las palabras desbloqueadas</Text>
      <View style={styles.collectionGrid}>
        {vocabulary.map((item) => (
          <View key={item.id} style={styles.collectionWordCard}>
            <Text style={styles.collectionWordKana}>{item.japanese}</Text>
            <Text style={styles.collectionWordRomaji}>{item.romaji}</Text>
            <Text numberOfLines={1} style={styles.collectionWordMeaning}>
              {item.meaningEs ?? item.meaningEn ?? '---'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function VocabularySeriesCard({
  item,
  onPress,
}: {
  item: VocabularySeriesProgress;
  onPress: () => void;
}) {
  const percent = getProgressPercent(item.learnedWords, item.totalWords || item.series.characters.length);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: item.locked }}
      disabled={item.locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.seriesCard,
        item.locked ? styles.seriesCardLocked : null,
        pressed && !item.locked ? styles.seriesCardPressed : null,
      ]}>
      <View style={styles.seriesTopRow}>
        <View style={styles.seriesBadge}>
          <Text style={styles.seriesBadgeText}>{getSeriesShortTitle(item.series)}</Text>
        </View>
        <View style={styles.seriesCopy}>
          <Text style={styles.seriesTitle}>{getSeriesTitle(item.series)}</Text>
          <Text style={styles.seriesKana}>
            {item.series.characters.map((character) => character.kana).join(' ')}
          </Text>
        </View>
        <Text style={styles.seriesCount}>
          {item.locked ? 'Bloqueada' : `${item.learnedWords} / ${item.totalWords} palabras`}
        </Text>
      </View>
      <ProgressBar disabled={item.locked} percent={percent} />
    </Pressable>
  );
}

function ProgressBar({ disabled = false, percent }: { disabled?: boolean; percent: number }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          disabled ? styles.progressFillDisabled : null,
          { width: `${Math.max(0, Math.min(100, percent))}%` },
        ]}
      />
    </View>
  );
}

function buildSeriesProgress(series: KanaSeries[], vocabulary: VocabularyItem[]): VocabularySeriesProgress[] {
  return series.map((item) => {
    const kanaSet = new Set(item.characters.map((character) => character.kana));
    const seriesVocabulary = vocabulary.filter(
      (word) => word.kanaSeries === item.id || kanaSet.has(word.kana),
    );

    return {
      series: item,
      vocabulary: seriesVocabulary,
      learnedWords: seriesVocabulary.length,
      totalWords: Math.max(seriesVocabulary.length, item.characters.length),
      locked: seriesVocabulary.length === 0,
    };
  });
}

function getProgressPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function getSeriesTitle(series: KanaSeries) {
  const baseId = getSeriesBaseId(series.id);

  if (baseId === 'vowels') {
    return 'Serie A';
  }

  return `Serie ${series.title.replace(/ Series$/u, '').replace(/^[HK]iragana /u, '')}`;
}

function getSeriesShortTitle(series: KanaSeries) {
  const first = series.characters[0]?.romaji?.charAt(0).toUpperCase();
  return first || series.representativeKana;
}

function getSeriesBaseId(seriesId: string) {
  return seriesId.replace(/^(hiragana|katakana|kanji)-/u, '');
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 28,
    paddingHorizontal: 14,
    paddingTop: 58,
  },
  content: {
    gap: 14,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    minHeight: 138,
    padding: 16,
    ...softShadow,
  },
  headerCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  headerMascot: {
    alignItems: 'center',
    backgroundColor: pastelColors.yellow,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  segmentedControl: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    padding: 5,
    ...softShadow,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: colors.onPrimary,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    ...softShadow,
  },
  collectionIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF0C8',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  collectionIconText: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: '900',
  },
  summaryCopy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  summaryValue: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '900',
  },
  progressButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  progressButtonText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  randomPracticeButton: {
    alignItems: 'center',
    backgroundColor: '#FFF7DB',
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...softShadow,
  },
  randomPracticeButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  collectionPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    ...softShadow,
  },
  collectionPanelTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  collectionWordCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
    minHeight: 94,
    padding: 10,
    width: '31.5%',
  },
  collectionWordKana: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  collectionWordRomaji: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  collectionWordMeaning: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: '#F4E6CC',
    borderRadius: radii.pill,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: '#F5B83B',
    borderRadius: radii.pill,
    height: '100%',
  },
  progressFillDisabled: {
    backgroundColor: colors.disabledText,
  },
  seriesList: {
    gap: 10,
  },
  stateText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '900',
    padding: 14,
    textAlign: 'center',
  },
  seriesCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    ...softShadow,
  },
  seriesCardLocked: {
    opacity: 0.52,
  },
  seriesCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  seriesTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  seriesBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  seriesBadgeText: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '900',
  },
  seriesCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  seriesTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  seriesKana: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 28,
  },
  seriesCount: {
    color: colors.mutedText,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    maxWidth: 116,
    textAlign: 'right',
  },
  footerCard: {
    alignItems: 'center',
    backgroundColor: '#FFF7DB',
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    ...softShadow,
  },
  footerMascot: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  footerCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  footerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  footerSubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
});
