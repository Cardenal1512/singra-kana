import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/shared/components/AppButton';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useTranslation } from '@/src/shared/i18n/useTranslation';

type CompletionModalProps = {
  compact?: boolean;
  onChangeMode: () => void;
  onNext: () => void;
  onRepeat: () => void;
};

export function CompletionModal({
  compact = false,
  onChangeMode,
  onNext,
  onRepeat,
}: CompletionModalProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.card, compact ? styles.compactCard : null]}>
      <View style={[styles.halo, compact ? styles.compactHalo : null]}>
        <Text style={[styles.mark, compact ? styles.compactMark : null]}>✓</Text>
      </View>

      <View style={[styles.copy, compact ? styles.compactCopy : null]}>
        <Text style={[styles.title, compact ? styles.compactTitle : null]}>
          {t.completion.title}
        </Text>
        {compact ? null : <Text style={styles.subtitle}>{t.completion.subtitle}</Text>}
      </View>

      <View style={[styles.actions, compact ? styles.compactActions : null]}>
        <View style={styles.action}>
          <AppButton
            label={t.common.next}
            onPress={onNext}
            size={compact ? 'compact' : 'regular'}
          />
        </View>
        <View style={styles.action}>
          <AppButton
            label={t.common.repeat}
            onPress={onRepeat}
            size={compact ? 'compact' : 'regular'}
            variant="secondary"
          />
        </View>
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
    gap: 18,
    maxWidth: 560,
    padding: 22,
    width: '100%',
    ...softShadow,
  },
  compactCard: {
    borderRadius: radii.card,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  halo: {
    alignItems: 'center',
    backgroundColor: pastelColors.mint,
    borderRadius: radii.pill,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  compactHalo: {
    height: 38,
    width: 38,
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
  compactActions: {
    gap: 6,
  },
  action: {
    alignSelf: 'stretch',
  },
});
