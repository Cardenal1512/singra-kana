import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ImageSourcePropType,
} from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { VocabularyImage } from '@/src/features/hiragana/domain/models/VocabularyImage';
import type { VocabularyItem } from '@/src/features/hiragana/domain/models/VocabularyItem';
import { getVocabularyImage } from '@/src/shared/assets/imageRegistry';
import { playSound } from '@/src/shared/audio/AudioService';
import { AppButton } from '@/src/shared/components/AppButton';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';
import { FloatingView } from '@/src/shared/motion/FloatingView';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type VocabularyDetailScreenProps = {
  getRemoteImageUrl: (fileName: string) => string | undefined;
  initialIndex: number;
  series: KanaSeries;
  vocabulary: VocabularyItem[];
  onBack: () => void;
  onPractice: (item: VocabularyItem) => void;
};

type TouchStart = {
  pageX: number;
  pageY: number;
  time: number;
};

export function VocabularyDetailScreen({
  getRemoteImageUrl,
  initialIndex,
  onBack,
  onPractice,
  series,
  vocabulary,
}: VocabularyDetailScreenProps) {
  const { isMobile, width } = useResponsiveLayout();
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, Math.max(0, vocabulary.length - 1))),
  );
  const fade = useRef(new Animated.Value(1)).current;
  const touchStartRef = useRef<TouchStart | undefined>(undefined);
  const contentWidth = Math.min(width - (isMobile ? 28 : 48), 760);
  const item = vocabulary[currentIndex] ?? vocabulary[0];
  const imageSource = item ? resolveVocabularyImage(item, getRemoteImageUrl) : undefined;
  const favorite = item ? isFavorite(item) : false;
  const seriesLabel = getSeriesLabel(series);

  useEffect(() => {
    fade.setValue(0.75);
    Animated.timing(fade, {
      duration: 180,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, fade]);

  if (!item) {
    return (
      <View style={styles.root}>
        <KawaiiBackground />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Palabra no encontrada</Text>
          <AppButton label="Volver" onPress={onBack} />
        </View>
      </View>
    );
  }

  function goToIndex(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(nextIndex, vocabulary.length - 1));

    if (boundedIndex === currentIndex) {
      return;
    }

    playSound('whoosh');
    setCurrentIndex(boundedIndex);
  }

  function handleSwipeEnd(event: GestureResponderEvent) {
    const start = touchStartRef.current;

    if (!start) {
      return;
    }

    const dx = event.nativeEvent.pageX - start.pageX;
    const dy = event.nativeEvent.pageY - start.pageY;
    const elapsed = Date.now() - start.time;

    if (Math.abs(dx) < 70 || Math.abs(dy) > 64 || elapsed > 800) {
      return;
    }

    goToIndex(dx < 0 ? currentIndex + 1 : currentIndex - 1);
  }

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={[item.kana, item.romaji, series.representativeKana]} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onTouchEnd={handleSwipeEnd}
        onTouchStart={(event) => {
          touchStartRef.current = {
            pageX: event.nativeEvent.pageX,
            pageY: event.nativeEvent.pageY,
            time: Date.now(),
          };
        }}>
        <Animated.View style={[styles.content, { opacity: fade, width: contentWidth }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                playSound('tap');
                onBack();
              }}
              style={styles.iconButton}>
              <Text style={styles.iconButtonText}>‹</Text>
            </Pressable>

            <Text style={styles.collectionNumber}>#{String(currentIndex + 1).padStart(3, '0')}</Text>

            <View style={styles.headerActions}>
              <Pressable accessibilityRole="button" onPress={() => playSound('tap')} style={styles.iconButton}>
                <Text style={[styles.iconButtonText, favorite ? styles.favoriteActive : null]}>★</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => playSound('tap')} style={styles.iconButton}>
                <Text style={styles.optionsText}>•••</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroCard}>
            <FloatingView>
              <View style={styles.imageStage}>
                {imageSource ? (
                  <Image resizeMode="contain" source={imageSource} style={styles.heroImage} />
                ) : (
                  <Text style={styles.imageFallback}>{item.kana || item.japanese}</Text>
                )}
              </View>
            </FloatingView>

            <Text style={styles.kana}>{item.japanese}</Text>
            <Text style={styles.romaji}>{item.romaji}</Text>
            <Pressable accessibilityRole="button" onPress={() => playSound('popup')} style={styles.audioButton}>
              <Text style={styles.audioIcon}>🔊</Text>
            </Pressable>
            <Text style={styles.meaning}>{item.meaningEs ?? item.meaningEn ?? 'Sin traducción'}</Text>
          </View>

          <View style={styles.navigationRow}>
            <StepButton disabled={currentIndex === 0} label="Anterior" onPress={() => goToIndex(currentIndex - 1)} />
            <Text style={styles.positionText}>{currentIndex + 1} / {vocabulary.length}</Text>
            <StepButton
              disabled={currentIndex >= vocabulary.length - 1}
              label="Siguiente"
              onPress={() => goToIndex(currentIndex + 1)}
            />
          </View>

          <View style={styles.techCard}>
            <TechRow label="Serie" value={seriesLabel.replace('Serie ', '')} />
            <TechRow label="Tipo" value={capitalize(item.kanaSystem)} />
            <TechRow label="Significado" value={item.meaningEs ?? item.meaningEn ?? 'Sin traducción'} />
            <TechRow label="Aprendida" value="Sí" />
            <TechRow label="Veces vista" value={getSeenCount(item)} />
            <TechRow label="Veces acertada" value={getCorrectCount(item)} />
            <TechRow label="Precisión" value={getAccuracy(item)} />
            <TechRow label="Fecha desbloqueo" value={formatDate(item.createdAt)} />
          </View>

          <View style={styles.actions}>
            <AppButton label="Practicar esta palabra" onPress={() => onPractice(item)} />
            <AppButton label="Añadir a favoritos" onPress={() => playSound('success')} variant="secondary" />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StepButton({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.stepButton, disabled ? styles.stepButtonDisabled : null]}>
      <Text style={[styles.stepButtonText, disabled ? styles.stepButtonTextDisabled : null]}>{label}</Text>
    </Pressable>
  );
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.techRow}>
      <Text style={styles.techLabel}>{label}:</Text>
      <Text style={styles.techValue}>{value}</Text>
    </View>
  );
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

function getSeenCount(item: VocabularyItem) {
  return item.tags.find((tag) => tag.startsWith('seen:'))?.replace('seen:', '') ?? '0';
}

function getCorrectCount(item: VocabularyItem) {
  return item.tags.find((tag) => tag.startsWith('correct:'))?.replace('correct:', '') ?? '0';
}

function getAccuracy(item: VocabularyItem) {
  const seen = Number(getSeenCount(item));
  const correct = Number(getCorrectCount(item));

  if (!seen || Number.isNaN(seen) || Number.isNaN(correct)) {
    return '0%';
  }

  return `${Math.round((correct / seen) * 100)}%`;
}

function getSeriesLabel(series: KanaSeries) {
  const baseId = series.id.replace(/^(hiragana|katakana|kanji)-/u, '');

  if (baseId === 'vowels') {
    return 'Serie A';
  }

  const firstRomaji = series.characters[0]?.romaji?.charAt(0).toUpperCase();
  return firstRomaji ? `Serie ${firstRomaji}` : series.title.replace(/ Series$/u, '');
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 26,
    paddingHorizontal: 14,
    paddingTop: 58,
  },
  content: {
    gap: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
    ...softShadow,
  },
  iconButtonText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  optionsText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  favoriteActive: {
    color: '#F5B83B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  collectionNumber: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 26,
    borderWidth: 1,
    gap: 6,
    padding: 18,
    ...softShadow,
  },
  imageStage: {
    alignItems: 'center',
    backgroundColor: pastelColors.yellow,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    height: 236,
    justifyContent: 'center',
    width: 236,
  },
  heroImage: {
    height: '92%',
    width: '92%',
  },
  imageFallback: {
    color: colors.primary,
    fontSize: 58,
    fontWeight: '900',
  },
  kana: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
  },
  romaji: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  audioButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  audioIcon: {
    fontSize: 19,
  },
  meaning: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  navigationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  stepButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    minWidth: 112,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...softShadow,
  },
  stepButtonDisabled: {
    opacity: 0.42,
  },
  stepButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  stepButtonTextDisabled: {
    color: colors.disabledText,
  },
  positionText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '900',
  },
  techCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    ...softShadow,
  },
  techRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 38,
  },
  techLabel: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '900',
  },
  techValue: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  actions: {
    gap: 9,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
});
