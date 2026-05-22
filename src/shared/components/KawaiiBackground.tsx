import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/src/shared/constants/colors';
import { pastelColors } from '@/src/shared/constants/visualSystem';
import { getAmbientFloatStyle } from '@/src/shared/motion/motionStyles';
import { usePrefersReducedMotion } from '@/src/shared/motion/usePrefersReducedMotion';

type KawaiiBackgroundProps = {
  kana?: string[];
};

export function KawaiiBackground({ kana = ['あ', 'か', 'ま'] }: KawaiiBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const bubbleTopMotion = getAmbientFloatStyle(prefersReducedMotion, 12000);
  const bubbleBottomMotion = getAmbientFloatStyle(prefersReducedMotion, 15000);
  const kanaLeftMotion = getAmbientFloatStyle(prefersReducedMotion, 13000);
  const kanaRightMotion = getAmbientFloatStyle(prefersReducedMotion, 16000);
  const kanaBottomMotion = getAmbientFloatStyle(prefersReducedMotion, 14000);

  return (
    <View pointerEvents="none" style={styles.container}>
      <AmbientElement durationMs={12000} motionStyle={bubbleTopMotion} style={[styles.bubble, styles.bubbleTop]} />
      <AmbientElement durationMs={15000} motionStyle={bubbleBottomMotion} style={[styles.bubble, styles.bubbleBottom]} />
      <AmbientElement
        durationMs={13000}
        motionStyle={kanaLeftMotion}
        style={[styles.kana, styles.kanaLeft]}
        transform={[{ rotate: '-12deg' }]}
        text>
        {kana[0]}
      </AmbientElement>
      <AmbientElement
        durationMs={16000}
        motionStyle={kanaRightMotion}
        style={[styles.kana, styles.kanaRight]}
        transform={[{ rotate: '10deg' }]}
        text>
        {kana[1]}
      </AmbientElement>
      <AmbientElement
        durationMs={14000}
        motionStyle={kanaBottomMotion}
        style={[styles.kana, styles.kanaBottom]}
        transform={[{ rotate: '-6deg' }]}
        text>
        {kana[2]}
      </AmbientElement>
    </View>
  );
}

type AmbientElementProps = {
  children?: ReactNode;
  durationMs: number;
  motionStyle?: ViewStyle;
  style: ViewStyle | ViewStyle[];
  text?: boolean;
  transform?: { rotate: string }[];
};

function AmbientElement({
  children,
  durationMs,
  motionStyle,
  style,
  text = false,
  transform = [],
}: AmbientElementProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web' || prefersReducedMotion) {
      translateY.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          duration: Math.floor(durationMs / 2),
          easing: Easing.inOut(Easing.ease),
          toValue: -10,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: Math.floor(durationMs / 2),
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [durationMs, prefersReducedMotion, translateY]);

  const baseStyle = [
    style,
    transform.length > 0 ? { transform } : null,
    Platform.OS === 'web' ? motionStyle : null,
  ];
  const animatedTransformStyle = {
    transform: [...transform, { translateY }],
  } as unknown as ViewStyle;

  if (text) {
    return (
      <Animated.Text
        style={[
          baseStyle as TextStyle[],
          Platform.OS !== 'web' && !prefersReducedMotion
            ? (animatedTransformStyle as TextStyle)
            : null,
        ]}>
        {children}
      </Animated.Text>
    );
  }

  return (
    <Animated.View
      style={[
        baseStyle,
        Platform.OS !== 'web' && !prefersReducedMotion
          ? animatedTransformStyle
          : null,
      ]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
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
  },
  kanaRight: {
    right: -16,
    top: 330,
  },
  kanaBottom: {
    bottom: 36,
    right: 28,
  },
});
