import { useEffect } from 'react';
import { Image, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type AnimatedSingraMood = 'idle' | 'happy' | 'error' | 'thinking';

type AnimatedSingraProps = {
  enabled?: boolean;
  mood?: AnimatedSingraMood;
  size: number;
  source: ImageSourcePropType;
};

export function AnimatedSingra({
  enabled = true,
  mood = 'idle',
  size,
  source,
}: AnimatedSingraProps) {
  const progress = useSharedValue(0);
  const burst = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    burst.value = 0;
    shake.value = 0;

    if (!enabled) {
      return;
    }

    if (mood === 'idle') {
      progress.value = withRepeat(
        withTiming(1, {
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
      return;
    }

    if (mood === 'thinking') {
      progress.value = withRepeat(
        withTiming(1, {
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
      return;
    }

    if (mood === 'happy') {
      burst.value = withDelay(
        80,
        withSequence(
          withTiming(1, { duration: 170, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) }),
        ),
      );
      return;
    }

    shake.value = withSequence(
      withTiming(1, { duration: 80, easing: Easing.linear }),
      withTiming(-1, { duration: 80, easing: Easing.linear }),
      withTiming(0.7, { duration: 80, easing: Easing.linear }),
      withTiming(-0.55, { duration: 80, easing: Easing.linear }),
      withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) }),
    );
  }, [burst, enabled, mood, progress, shake]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {};
    }

    if (mood === 'happy') {
      return {
        transform: [
          { translateY: interpolate(burst.value, [0, 1], [0, -4]) },
          { scale: interpolate(burst.value, [0, 1], [1, 1.03]) },
          { rotate: `${interpolate(burst.value, [0, 1], [0, 2])}deg` },
        ],
      };
    }

    if (mood === 'error') {
      return {
        transform: [
          { translateX: interpolate(shake.value, [-1, 1], [-4, 4]) },
          { rotate: `${interpolate(shake.value, [-1, 1], [-3, 3])}deg` },
        ],
      };
    }

    if (mood === 'thinking') {
      return {
        transform: [
          { translateY: interpolate(progress.value, [0, 1], [0, -4]) },
          { rotate: `${interpolate(progress.value, [0, 1], [-1.5, 1.5])}deg` },
        ],
      };
    }

    return {
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [0, -3]) },
        { scale: interpolate(progress.value, [0, 1], [1, 1.02]) },
      ],
    };
  });

  if (!enabled) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={source}
        style={{ height: size, width: size }}
      />
    );
  }

  return (
    <Animated.Image
      accessibilityIgnoresInvertColors
      resizeMode="contain"
      source={source}
      style={[{ height: size, width: size }, animatedStyle]}
    />
  );
}
