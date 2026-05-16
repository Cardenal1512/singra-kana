import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors } from '@/src/shared/constants/colors';
import { radii, softShadow } from '@/src/shared/constants/visualSystem';
import { softTransition } from '@/src/shared/motion/motionStyles';
import { usePrefersReducedMotion } from '@/src/shared/motion/usePrefersReducedMotion';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  size?: 'regular' | 'compact';
  variant?: 'primary' | 'secondary';
};

export function AppButton({
  label,
  onPress,
  size = 'regular',
  variant = 'primary',
}: AppButtonProps) {
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'compact' ? styles.compactButton : null,
        variant === 'secondary' ? styles.secondaryButton : styles.primaryButton,
        hovered && !prefersReducedMotion ? styles.hovered : null,
        pressed && !prefersReducedMotion ? styles.pressed : null,
      ]}>
      <Text
        style={[
          styles.label,
          size === 'compact' ? styles.compactLabel : null,
          variant === 'secondary' ? styles.secondaryLabel : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

type WebButtonStyle = ViewStyle & {
  cursor?: 'pointer';
  transitionDuration?: string;
  transitionProperty?: string;
  transitionTimingFunction?: string;
};

const webButtonStyle = Platform.select<ViewStyle>({
  web: {
    cursor: 'pointer',
    transitionDuration: '160ms',
    transitionProperty: 'opacity, transform, box-shadow',
    transitionTimingFunction: 'ease',
  } as unknown as WebButtonStyle,
});

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.pill,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    ...softShadow,
    ...softTransition,
    ...webButtonStyle,
  },
  compactButton: {
    minHeight: 42,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    shadowOpacity: 0.03,
  },
  label: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  compactLabel: {
    fontSize: 14,
  },
  secondaryLabel: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  hovered: {
    shadowOpacity: 0.16,
    shadowRadius: 22,
    transform: [{ translateY: -3 }, { scale: 1.02 }],
  },
});
