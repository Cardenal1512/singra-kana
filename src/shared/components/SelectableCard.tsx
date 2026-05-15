import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/constants/colors';
import { radii, softShadow } from '@/src/shared/constants/visualSystem';

type SelectableCardProps = {
  title: string;
  subtitle?: string;
  disabled?: boolean;
  onPress?: () => void;
};

export function SelectableCard({ title, subtitle, disabled = false, onPress }: SelectableCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        disabled ? styles.disabledCard : null,
        pressed ? styles.pressed : null,
      ]}>
      <View style={styles.content}>
        <Text style={[styles.title, disabled ? styles.disabledText : null]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, disabled ? styles.disabledText : null]}>{subtitle}</Text>
        ) : null}
      </View>
      {disabled ? <Text style={styles.lockedLabel}>Locked</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    minHeight: 84,
    paddingHorizontal: 22,
    paddingVertical: 18,
    ...softShadow,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 19,
  },
  disabledCard: {
    backgroundColor: colors.disabledSurface,
  },
  disabledText: {
    color: colors.disabledText,
  },
  lockedLabel: {
    color: colors.disabledText,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
});
