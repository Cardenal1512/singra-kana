import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/constants/colors';
import { pastelColors } from '@/src/shared/constants/visualSystem';

type KawaiiBackgroundProps = {
  kana?: string[];
};

export function KawaiiBackground({ kana = ['あ', 'か', 'ま'] }: KawaiiBackgroundProps) {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.bubble, styles.bubbleTop]} />
      <View style={[styles.bubble, styles.bubbleBottom]} />
      <Text style={[styles.kana, styles.kanaLeft]}>{kana[0]}</Text>
      <Text style={[styles.kana, styles.kanaRight]}>{kana[1]}</Text>
      <Text style={[styles.kana, styles.kanaBottom]}>{kana[2]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bubble: {
    borderRadius: 999,
    opacity: 0.38,
    position: 'absolute',
  },
  bubbleTop: {
    backgroundColor: pastelColors.yellow,
    height: 220,
    right: -90,
    top: 42,
    width: 220,
  },
  bubbleBottom: {
    backgroundColor: pastelColors.blue,
    bottom: -110,
    height: 240,
    left: -94,
    width: 240,
  },
  kana: {
    color: colors.borderStrong,
    fontSize: 118,
    fontWeight: '900',
    opacity: 0.13,
    position: 'absolute',
  },
  kanaLeft: {
    left: -26,
    top: 92,
    transform: [{ rotate: '-12deg' }],
  },
  kanaRight: {
    right: -16,
    top: 330,
    transform: [{ rotate: '10deg' }],
  },
  kanaBottom: {
    bottom: 36,
    right: 28,
    transform: [{ rotate: '-6deg' }],
  },
});
