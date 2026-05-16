import type { Transition, Variants } from 'framer-motion';

export const cozyEase = [0.22, 1, 0.36, 1] as const;

export const pageTransition: Transition = {
  duration: 0.56,
  ease: cozyEase,
};

export const reducedMotionTransition: Transition = {
  duration: 0.18,
};

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -12,
  },
};

export const reducedMotionPageVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      delayChildren: 0.18,
      staggerChildren: 0.13,
    },
  },
};

export const itemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 18,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
};
