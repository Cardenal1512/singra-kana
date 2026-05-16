import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import {
  containerVariants,
  itemVariants,
  pageTransition,
  reducedMotionTransition,
} from '@/src/shared/motion/variants.web';

type MotionProps = {
  children: ReactNode;
};

const MotionView = motion.create(View);

export function MotionStagger({ children }: MotionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionView
      variants={shouldReduceMotion ? undefined : containerVariants}
      initial="initial"
      animate="animate"
      style={staggerStyle}>
      {children}
    </MotionView>
  );
}

export function MotionItem({ children }: MotionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionView
      variants={shouldReduceMotion ? undefined : itemVariants}
      transition={shouldReduceMotion ? reducedMotionTransition : pageTransition}
      style={itemStyle}>
      {children}
    </MotionView>
  );
}

const staggerStyle = {
  alignItems: 'center',
  flexDirection: 'column',
  gap: 28,
  opacity: 1,
  width: '100%',
} as const;

const itemStyle = {
  flexDirection: 'column',
  opacity: 1,
  width: '100%',
} as const;
