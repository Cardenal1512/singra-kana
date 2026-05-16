import { useEffect } from 'react';
import { Platform } from 'react-native';

const styleElementId = 'singra-motion-styles';

export function MotionStyleSheet() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    if (document.getElementById(styleElementId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleElementId;
    style.textContent = `
      @keyframes singraCardEnter {
        from { opacity: 0; transform: translateY(18px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes singraAmbientFloat {
        from { transform: translate3d(0, 0, 0) rotate(var(--singra-rotate-from, 0deg)); }
        to { transform: translate3d(0, -10px, 0) rotate(var(--singra-rotate-to, 0deg)); }
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 1ms !important;
          scroll-behavior: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}
