import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { usePrefersReducedMotion } from '@/src/shared/motion/usePrefersReducedMotion';

type FloatingViewProps = {
  children: ReactNode;
};

export function FloatingView({ children }: FloatingViewProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prefersReducedMotion) {
      translateY.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          toValue: -8,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [prefersReducedMotion, translateY]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
