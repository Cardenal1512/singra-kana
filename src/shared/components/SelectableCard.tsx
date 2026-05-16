import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/constants/colors';
import { radii, softShadow } from '@/src/shared/constants/visualSystem';
import { getCardEnterStyle, softTransition } from '@/src/shared/motion/motionStyles';
import { usePrefersReducedMotion } from '@/src/shared/motion/usePrefersReducedMotion';

type SelectableCardProps = {
  title: string;
  subtitle?: string;
  disabled?: boolean;
  index?: number;
  onPress?: () => void;
};

export function SelectableCard({
  title,
  subtitle,
  disabled = false,
  index = 0,
  onPress,
}: SelectableCardProps) {
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
        styles.card,
        getCardEnterStyle(index, prefersReducedMotion),
        disabled ? styles.disabledCard : null,
        hovered && !disabled && !prefersReducedMotion ? styles.hovered : null,
        pressed && !disabled && !prefersReducedMotion ? styles.pressed : null,
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
    ...softTransition,
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
    transform: [{ scale: 0.98 }],
  },
  hovered: {
    shadowOpacity: 0.14,
    shadowRadius: 24,
    transform: [{ translateY: -6 }, { scale: 1.015 }],
  },
});
