import { Platform, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors } from '@/src/shared/constants/colors';
import { radii, softShadow } from '@/src/shared/constants/visualSystem';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function AppButton({ label, onPress, variant = 'primary' }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondaryButton : styles.primaryButton,
        pressed ? styles.pressed : null,
      ]}>
      <Text style={[styles.label, variant === 'secondary' ? styles.secondaryLabel : null]}>
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
    ...webButtonStyle,
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
  secondaryLabel: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
});
