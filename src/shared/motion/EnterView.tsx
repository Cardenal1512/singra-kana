import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

type EnterViewProps = {
  children: ReactNode;
  index?: number;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function EnterView({
  children,
  index = 0,
  reducedMotion = false,
  style,
}: EnterViewProps) {
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 18)).current;
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : 0.96)).current;

  useEffect(() => {
    if (Platform.OS === 'web' || reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      scale.setValue(1);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(18);
    scale.setValue(0.96);

    const delay = 140 + Math.min(index * 120, 560);
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        delay,
        duration: 540,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        delay,
        duration: 540,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        delay,
        duration: 540,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [index, opacity, reducedMotion, scale, translateY]);

  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
