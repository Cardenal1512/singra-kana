import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/src/shared/constants/colors';

type SingraProgressBarProps = {
  current: number;
  total: number;
  label?: string;
};

export function SingraProgressBar({ current, label, total }: SingraProgressBarProps) {
  const progress = useSharedValue(getProgress(current, total));

  useEffect(() => {
    progress.value = withTiming(getProgress(current, total), {
      duration: 520,
    });
  }, [current, progress, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

function getProgress(current: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, current / total));
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  track: {
    backgroundColor: '#FFF2B8',
    borderColor: '#E8B33E',
    borderRadius: 999,
    borderWidth: 1,
    height: 13,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: '#F2B84B',
    borderRadius: 999,
    height: '100%',
  },
});
