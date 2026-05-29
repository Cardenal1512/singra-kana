import { useEffect } from 'react';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import type { ReactNode } from 'react';

import { AnimatedSingra } from '@/src/shared/components/AnimatedSingra';
import { AppButton } from '@/src/shared/components/AppButton';
import { playSound } from '@/src/shared/audio/AudioService';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useTranslation } from '@/src/shared/i18n/useTranslation';

type CompletionModalProps = {
  compact?: boolean;
  heroImageSource?: ImageSourcePropType;
  insight?: ReactNode;
  nextLabel?: string;
  nextDisabled?: boolean;
  onChangeMode: () => void;
  onNext: () => void;
  onRepeat: () => void;
  onReviewFailures?: () => void;
  repeatDisabled?: boolean;
  repeatLabel?: string;
  reviewFailuresDisabled?: boolean;
  reviewFailuresLabel?: string;
};

export function CompletionModal({
  compact = false,
  heroImageSource,
  insight,
  nextLabel,
  nextDisabled = false,
  onChangeMode,
  onNext,
  onRepeat,
  onReviewFailures,
  repeatDisabled = false,
  repeatLabel,
  reviewFailuresDisabled = false,
  reviewFailuresLabel,
}: CompletionModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    playSound('popup');
  }, []);

  return (
    <View style={[styles.card, compact ? styles.compactCard : null]}>
      <View style={[styles.halo, compact ? styles.compactHalo : null]}>
        {heroImageSource ? (
          <AnimatedSingra
            mood="happy"
            size={compact ? 48 : 92}
            source={heroImageSource}
          />
        ) : (
          <Text style={[styles.mark, compact ? styles.compactMark : null]}>✓</Text>
        )}
      </View>

      <View style={[styles.copy, compact ? styles.compactCopy : null]}>
        <Text style={[styles.title, compact ? styles.compactTitle : null]}>
          {t.completion.title}
        </Text>
        {compact ? null : <Text style={styles.subtitle}>{t.completion.subtitle}</Text>}
      </View>

      {insight ? <View style={styles.insight}>{insight}</View> : null}

      <View style={[styles.actions, compact ? styles.compactActions : null]}>
        <View style={styles.action}>
          <AppButton
            disabled={nextDisabled}
            label={nextLabel ?? t.common.next}
            onPress={onNext}
            size={compact ? 'compact' : 'regular'}
          />
        </View>
        <View style={styles.action}>
          <AppButton
            disabled={repeatDisabled}
            label={repeatLabel ?? t.common.repeat}
            onPress={onRepeat}
            size={compact ? 'compact' : 'regular'}
            variant="secondary"
          />
        </View>
        {reviewFailuresLabel ? (
          <View style={styles.action}>
            <AppButton
              disabled={reviewFailuresDisabled}
              label={reviewFailuresLabel}
              onPress={onReviewFailures ?? onRepeat}
              size={compact ? 'compact' : 'regular'}
              variant="secondary"
            />
          </View>
        ) : null}
        <View style={styles.action}>
          <AppButton
            label={t.common.changeMode}
            onPress={onChangeMode}
            size={compact ? 'compact' : 'regular'}
            variant="secondary"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.panel,
    borderWidth: 1,
    gap: 14,
    maxWidth: 560,
    padding: 20,
    width: '100%',
    ...softShadow,
  },
  compactCard: {
    borderRadius: radii.card,
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  halo: {
    alignItems: 'center',
    backgroundColor: pastelColors.yellow,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  compactHalo: {
    height: 54,
    width: 54,
  },
  heroImage: {
    height: 92,
    width: 92,
  },
  compactHeroImage: {
    height: 48,
    width: 48,
  },
  mark: {
    color: colors.success,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 50,
  },
  compactMark: {
    fontSize: 23,
    lineHeight: 30,
  },
  copy: {
    gap: 6,
  },
  compactCopy: {
    gap: 0,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  compactTitle: {
    fontSize: 18,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: 10,
  },
  insight: {
    alignSelf: 'stretch',
  },
  compactActions: {
    gap: 6,
  },
  action: {
    alignSelf: 'stretch',
  },
});
