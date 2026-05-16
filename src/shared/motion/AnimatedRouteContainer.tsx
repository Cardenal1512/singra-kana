import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { usePrefersReducedMotion } from '@/src/shared/motion/usePrefersReducedMotion';

type AnimatedRouteContainerProps = {
  children: ReactNode;
  routeKey: string;
};

export function AnimatedRouteContainer({ children, routeKey }: AnimatedRouteContainerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(prefersReducedMotion ? 0 : 0);
    translateY.setValue(prefersReducedMotion ? 0 : 18);

    Animated.parallel([
      Animated.timing(opacity, {
        duration: prefersReducedMotion ? 180 : 460,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: prefersReducedMotion ? 180 : 460,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, prefersReducedMotion, routeKey, translateY]);

  return (
    <Animated.View
      key={routeKey}
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
