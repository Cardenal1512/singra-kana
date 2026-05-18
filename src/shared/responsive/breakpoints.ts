import { useWindowDimensions } from 'react-native';

export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

export const breakpoints = {
  mobileMax: 599,
  tabletMin: 600,
  tabletMax: 1023,
  desktopMin: 1024,
} as const;

export function getViewportMode(width: number): ViewportMode {
  if (width >= breakpoints.desktopMin) {
    return 'desktop';
  }

  if (width >= breakpoints.tabletMin) {
    return 'tablet';
  }

  return 'mobile';
}

export function useResponsiveLayout() {
  const dimensions = useWindowDimensions();
  const mode = getViewportMode(dimensions.width);

  return {
    ...dimensions,
    isDesktop: mode === 'desktop',
    isMobile: mode === 'mobile',
    isTablet: mode === 'tablet',
    mode,
  };
}
