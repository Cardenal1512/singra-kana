import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener?.('change', handleChange);

    return () => {
      mediaQuery.removeEventListener?.('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
