import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type FloatingViewProps = {
  children: ReactNode;
};

const MotionView = motion.create(View);

export function FloatingView({ children }: FloatingViewProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionView
      animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
      transition={
        shouldReduceMotion
          ? undefined
          : {
              duration: 4,
              ease: 'easeInOut',
              repeat: Infinity,
            }
      }
      style={{ alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </MotionView>
  );
}
