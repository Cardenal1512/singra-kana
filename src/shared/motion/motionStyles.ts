import { Platform, type ViewStyle } from 'react-native';

type WebMotionStyle = ViewStyle & {
  animationDelay?: string;
  animationDirection?: 'alternate';
  animationDuration?: string;
  animationFillMode?: 'both';
  animationIterationCount?: 'infinite';
  animationName?: string;
  animationTimingFunction?: string;
  filter?: string;
  transitionDuration?: string;
  transitionProperty?: string;
  transitionTimingFunction?: string;
};

export function getStaggeredEnterStyle(
  index: number,
  reducedMotion: boolean,
): ViewStyle | undefined {
  if (reducedMotion) {
    return undefined;
  }

  return Platform.select<ViewStyle>({
    web: {
      animationDelay: `${140 + Math.min(index * 120, 560)}ms`,
      animationDuration: '540ms',
      animationFillMode: 'both',
      animationName: 'singraCardEnter',
      animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    } as unknown as WebMotionStyle,
  });
}

export const getCardEnterStyle = getStaggeredEnterStyle;

export function getAmbientFloatStyle(
  reducedMotion: boolean,
  durationMs = 9000,
): ViewStyle | undefined {
  if (reducedMotion) {
    return undefined;
  }

  return Platform.select<ViewStyle>({
    web: {
      animationDirection: 'alternate',
      animationDuration: `${durationMs}ms`,
      animationIterationCount: 'infinite',
      animationName: 'singraAmbientFloat',
      animationTimingFunction: 'ease-in-out',
    } as unknown as WebMotionStyle,
  });
}

export const softTransition = Platform.select<ViewStyle>({
  web: {
    transitionDuration: '260ms',
    transitionProperty: 'opacity, transform, box-shadow',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  } as unknown as WebMotionStyle,
});
