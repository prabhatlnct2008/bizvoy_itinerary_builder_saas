import { Variants } from 'framer-motion';

/**
 * Framer Motion animation variants for swipe cards
 */

export const cardVariants: Variants = {
  // Initial state when card enters
  enter: {
    scale: 0.9,
    opacity: 0,
    y: 50,
  },
  // Center position (default state)
  center: {
    scale: 1,
    opacity: 1,
    y: 0,
    x: 0,
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  // Exit to the left (PASS)
  exitLeft: {
    x: -400,
    opacity: 0,
    rotate: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
  // Exit to the right (LIKE)
  exitRight: {
    x: 400,
    opacity: 0,
    rotate: 20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

export const cardFlipVariants: Variants = {
  front: {
    rotateY: 0,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  back: {
    rotateY: 180,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

export const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
    },
  },
};
