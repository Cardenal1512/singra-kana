import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import type { VocabularyImage } from '@/src/features/hiragana/domain/models/VocabularyImage';
import { getVocabularyImage } from '@/src/shared/assets/imageRegistry';
import { playSound } from '@/src/shared/audio/AudioService';
import { AppButton } from '@/src/shared/components/AppButton';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type VocabularySeriesScreenProps = {
  getRemoteImageUrl: (fileName: string) => string | undefined;
  series: KanaSeries;
  vocabulary: VocabularyItem[];
  onBack: () => void;
  onOpenDetail: (index: number) => void;
  onPractice: () => void;
};

type SortMode = 'recent' | 'kana';

export function VocabularySeriesScreen({
  getRemoteImageUrl,
  onBack,
  onOpenDetail,
  onPractice,
  series,
  vocabulary,
}: VocabularySeriesScreenProps) {
  const { isMobile, width } = useResponsiveLayout();
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const contentWidth = Math.min(width - (isMobile ? 28 : 48), 820);
  const cardGap = 9;
  const cardWidth = Math.floor((contentWidth - cardGap * 2) / 3);
  const targetWordCount = getSeriesTargetWordCount(series, vocabulary.length);
  const learnedWords = vocabulary.length;
  const slots = useMemo(
    () => buildSlots(sortVocabulary(vocabulary, sortMode), targetWordCount),
    [sortMode, targetWordCount, vocabulary],
  );
  const seriesLabel = getSeriesLabel(series);

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={series.characters.map((character) => character.kana).slice(0, 5)} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                playSound('tap');
                onBack();
              }}
              style={styles.backButton}>
              <Text style={styles.backText}>Volver</Text>
            </Pressable>

            <View style={styles.headerCopy}>
              <Text style={styles.title}>{seriesLabel}</Text>
              <Text style={styles.subtitle}>{learnedWords} / {targetWordCount} palabras</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                playSound('tap');
                setSortMode((currentMode) => currentMode === 'recent' ? 'kana' : 'recent');
              }}
              style={styles.sortButton}>
              <Text style={styles.sortButtonText}>Ordenar</Text>
            </Pressable>
          </View>

          <View style={[styles.grid, { gap: cardGap }]}>
            {slots.map((item, index) => (
              <VocabularyMiniCard
                key={item?.id ?? `locked-${index}`}
                getRemoteImageUrl={getRemoteImageUrl}
                index={index}
                item={item}
                onOpenDetail={onOpenDetail}
                width={cardWidth}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.fixedFooter}>
        <View style={[styles.footerInner, { width: contentWidth }]}>
          <AppButton label={`Practicar ${seriesLabel}`} onPress={onPractice} />
        </View>
      </View>
    </View>
  );
}

function VocabularyMiniCard({
  getRemoteImageUrl,
  index,
  item,
  onOpenDetail,
  width,
}: {
  getRemoteImageUrl: (fileName: string) => string | undefined;
  index: number;
  item?: VocabularyItem;
  onOpenDetail: (index: number) => void;
  width: number;
}) {
  const imageSource = item ? resolveVocabularyImage(item, getRemoteImageUrl) : undefined;
  const favorite = item ? isFavorite(item) : false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !item }}
      disabled={!item}
      onPress={() => {
        if (!item) {
          return;
        }

        playSound('tap');
        onOpenDetail(index);
      }}
      style={({ pressed }) => [
        styles.wordCard,
        !item ? styles.wordCardLocked : null,
        pressed && item ? styles.wordCardPressed : null,
        { width },
      ]}>
      {favorite ? <Text style={styles.favoriteStar}>★</Text> : null}

      <View style={styles.imageFrame}>
        {item && imageSource ? (
          <Image resizeMode="contain" source={imageSource} style={styles.wordImage} />
        ) : (
          <Text style={styles.lockMark}>{item ? item.kana || item.japanese : '🔒'}</Text>
        )}
      </View>

      <Text style={[styles.wordKana, !item ? styles.lockedText : null]} numberOfLines={1}>
        {item ? item.japanese : '???'}
      </Text>
      <Text style={[styles.wordRomaji, !item ? styles.lockedText : null]} numberOfLines={1}>
        {item ? item.romaji : '???'}
      </Text>
      <Text style={[styles.wordMeaning, !item ? styles.lockedText : null]} numberOfLines={2}>
        {item ? item.meaningEs ?? item.meaningEn ?? 'Sin traducción' : '???'}
      </Text>
    </Pressable>
  );
}

function buildSlots(vocabulary: VocabularyItem[], targetWordCount: number) {
  return Array.from({ length: targetWordCount }, (_, index) => vocabulary[index]);
}

function sortVocabulary(vocabulary: VocabularyItem[], sortMode: SortMode) {
  return [...vocabulary].sort((first, second) => {
    if (sortMode === 'kana') {
      return first.kana.localeCompare(second.kana, 'ja');
    }

    return Date.parse(second.createdAt) - Date.parse(first.createdAt);
  });
}

function resolveVocabularyImage(
  item: VocabularyItem,
  getRemoteImageUrl: (fileName: string) => string | undefined,
): ImageSourcePropType | undefined {
  const image = [...item.images].sort((first, second) => first.sortOrder - second.sortOrder)[0];

  if (!image) {
    return undefined;
  }

  if (image.imageUrl) {
    return { uri: image.imageUrl };
  }

  const fileName = getVocabularyImageFileName(image);
  const remoteUrl = fileName ? getRemoteImageUrl(fileName) : undefined;

  return remoteUrl ? { uri: remoteUrl } : getVocabularyImage(image.localAssetKey);
}

function getVocabularyImageFileName(image: VocabularyImage): string | undefined {
  const imagePath = image.imagePath ?? image.localAssetKey;

  if (!imagePath) {
    return undefined;
  }

  const normalizedPath = imagePath.replaceAll('\\', '/');
  const fileName = normalizedPath.split('/').filter(Boolean).pop();

  if (!fileName) {
    return undefined;
  }

  return fileName.includes('.') ? fileName : `${fileName}.webp`;
}

function isFavorite(item: VocabularyItem) {
  return item.tags.includes('favorite') || item.tags.includes('favorita');
}

function getSeriesTargetWordCount(series: KanaSeries, learnedWords: number) {
  const baseId = getSeriesBaseId(series.id);
  const defaultTarget = baseId === 'vowels'
    ? series.characters.length
    : series.characters.length * 3;

  return Math.max(defaultTarget, learnedWords);
}

function getSeriesLabel(series: KanaSeries) {
  const baseId = getSeriesBaseId(series.id);

  if (baseId === 'vowels') {
    return 'Serie A';
  }

  const firstRomaji = series.characters[0]?.romaji?.charAt(0).toUpperCase();
  return firstRomaji ? `Serie ${firstRomaji}` : series.title.replace(/ Series$/u, '');
}

function getSeriesBaseId(seriesId: string) {
  return seriesId.replace(/^(hiragana|katakana|kanji)-/u, '');
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 112,
    paddingHorizontal: 14,
    paddingTop: 58,
  },
  content: {
    gap: 14,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    ...softShadow,
  },
  backButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  backText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  sortButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  sortButtonText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
    minHeight: 166,
    padding: 8,
    position: 'relative',
    ...softShadow,
  },
  wordCardLocked: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.82,
  },
  wordCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  favoriteStar: {
    color: '#F5B83B',
    fontSize: 16,
    fontWeight: '900',
    position: 'absolute',
    right: 8,
    top: 6,
    zIndex: 2,
  },
  imageFrame: {
    alignItems: 'center',
    backgroundColor: pastelColors.yellow,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    width: '100%',
  },
  wordImage: {
    height: '92%',
    width: '92%',
  },
  lockMark: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  wordKana: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  wordRomaji: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
  },
  wordMeaning: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
  lockedText: {
    color: colors.disabledText,
  },
  fixedFooter: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 234, 0.94)',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingBottom: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
  },
  footerInner: {
    maxWidth: 820,
  },
});
