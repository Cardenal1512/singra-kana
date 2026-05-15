import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { colors } from '@/src/shared/constants/colors';

type PracticeModeCardProps = {
  title: string;
  description: string;
  japaneseLabel: string;
  imageSource?: ImageSourcePropType;
  accentColor: string;
  disabled?: boolean;
  comingSoonLabel: string;
  onPress?: () => void;
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
  width,
}: PracticeModeCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: accentColor, width },
        disabled ? styles.disabledCard : null,
        pressed && !disabled ? styles.pressed : null,
      ]}>
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
        <Text style={[styles.japaneseLabel, disabled ? styles.disabledText : null]}>
          {japaneseLabel}
        </Text>
        {disabled ? <Text style={styles.comingSoon}>{comingSoonLabel}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    minHeight: 306,
    padding: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 1,
  },
  imageFrame: {
    alignItems: 'center',
    borderRadius: 15,
    height: 172,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 4,
    position: 'relative',
  },
  halo: {
    backgroundColor: 'rgba(255, 253, 247, 0.64)',
    borderRadius: 999,
    height: 132,
    position: 'absolute',
    width: 132,
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
    gap: 3,
    paddingHorizontal: 5,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  description: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  footer: {
    gap: 4,
    paddingHorizontal: 5,
  },
  japaneseLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  comingSoon: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
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
    transform: [{ translateY: 1 }],
  },
});
