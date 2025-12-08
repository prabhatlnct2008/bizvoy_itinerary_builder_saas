import { Variants } from 'framer-motion';

/**
 * Framer Motion animation variants for vibe bubbles
 */

export const bubbleVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: (index: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
  },
  selected: {
    scale: 1.1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export const bubbleFloatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const bubbleGlowVariants: Variants = {
  idle: {
    boxShadow: '0 0 0 0 rgba(0, 230, 118, 0)',
  },
  selected: {
    boxShadow: [
      '0 0 0 0 rgba(0, 230, 118, 0.4)',
      '0 0 0 10px rgba(0, 230, 118, 0)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  },
};
