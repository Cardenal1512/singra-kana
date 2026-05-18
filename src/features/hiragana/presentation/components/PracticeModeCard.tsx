import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { colors } from '@/src/shared/constants/colors';
import { radii } from '@/src/shared/constants/visualSystem';
import { getCardEnterStyle, softTransition } from '@/src/shared/motion/motionStyles';
import { usePrefersReducedMotion } from '@/src/shared/motion/usePrefersReducedMotion';

type PracticeModeCardProps = {
  title: string;
  description: string;
  japaneseLabel: string;
  imageSource?: ImageSourcePropType;
  accentColor: string;
  disabled?: boolean;
  comingSoonLabel: string;
  onPress?: () => void;
  index?: number;
  width: number;
};

export function PracticeModeCard({
  title,
  description,
  japaneseLabel,
  imageSource,
  accentColor,
  disabled = false,
  comingSoonLabel,
  onPress,
  index = 0,
  width,
}: PracticeModeCardProps) {
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
        { borderColor: accentColor, width },
        getCardEnterStyle(index, prefersReducedMotion),
        disabled ? styles.disabledCard : null,
        hovered && !disabled && !prefersReducedMotion ? styles.hovered : null,
        pressed && !disabled && !prefersReducedMotion ? styles.pressed : null,
      ]}>
      <View style={styles.japaneseHeader}>
        <Text style={[styles.japaneseLabel, disabled ? styles.disabledText : null]}>
          {japaneseLabel}
        </Text>
      </View>

      <View style={[styles.imageFrame, { backgroundColor: accentColor }]}>
        <View style={styles.halo} />
        {!disabled && imageSource ? (
          <Image source={imageSource} resizeMode="contain" style={styles.image} />
        ) : (
          <View style={styles.comingSoonVisual}>
            <Text style={styles.comingSoonKana}>{japaneseLabel}</Text>
            <Text style={styles.visualComingSoon}>{comingSoonLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={2} style={[styles.title, disabled ? styles.disabledText : null]}>
          {title}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.description, disabled ? styles.disabledText : null]}>
          {description}
        </Text>
      </View>

      <View style={styles.footer}>
        {disabled ? <Text style={styles.comingSoon}>{comingSoonLabel}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    minHeight: 326,
    padding: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.045,
    shadowRadius: 22,
    elevation: 1,
    ...softTransition,
  },
  japaneseHeader: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  imageFrame: {
    alignItems: 'center',
    borderRadius: 18,
    height: 168,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 7,
    position: 'relative',
  },
  halo: {
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    borderRadius: radii.pill,
    height: 126,
    position: 'absolute',
    width: 126,
  },
  image: {
    height: '98%',
    width: '98%',
  },
  comingSoonVisual: {
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  comingSoonKana: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    opacity: 0.5,
    textAlign: 'center',
  },
  visualComingSoon: {
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    borderRadius: 999,
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  copy: {
    flex: 1,
    gap: 5,
    paddingHorizontal: 7,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 21,
    textAlign: 'center',
  },
  description: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    minHeight: 26,
    paddingHorizontal: 7,
  },
  japaneseLabel: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    textAlign: 'center',
  },
  comingSoon: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  disabledCard: {
    opacity: 0.72,
  },
  disabledText: {
    color: colors.disabledText,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  hovered: {
    shadowOpacity: 0.12,
    shadowRadius: 28,
    transform: [{ translateY: -5 }, { scale: 1.012 }],
  },
});
