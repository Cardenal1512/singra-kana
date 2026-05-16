import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import {
  pageTransition,
  pageVariants,
  reducedMotionPageVariants,
  reducedMotionTransition,
} from '@/src/shared/motion/variants.web';

type AnimatedRouteContainerProps = {
  children: ReactNode;
  routeKey: string;
};

export function AnimatedRouteContainer({ children, routeKey }: AnimatedRouteContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        variants={shouldReduceMotion ? reducedMotionPageVariants : pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={shouldReduceMotion ? reducedMotionTransition : pageTransition}
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: '100dvh',
          opacity: 1,
          overflowY: 'auto',
          width: '100%',
        }}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
