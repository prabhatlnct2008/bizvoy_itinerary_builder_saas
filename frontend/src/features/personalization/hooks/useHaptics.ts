import { useCallback } from 'react';

/**
 * Custom hook for haptic feedback (vibration)
 * Provides vibration patterns for different interactions
 */
export const useHaptics = () => {
  const isHapticsSupported = 'vibrate' in navigator;

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (isHapticsSupported) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  }, [isHapticsSupported]);

  // Light tap (e.g., button press)
  const lightTap = useCallback(() => {
    triggerHaptic(10);
  }, [triggerHaptic]);

  // Medium tap (e.g., selection)
  const mediumTap = useCallback(() => {
    triggerHaptic(25);
  }, [triggerHaptic]);

  // Success feedback
  const success = useCallback(() => {
    triggerHaptic([50, 50, 50]);
  }, [triggerHaptic]);

  // Error feedback
  const error = useCallback(() => {
    triggerHaptic([100, 50, 100]);
  }, [triggerHaptic]);

  // Swipe feedback
  const swipe = useCallback(() => {
    triggerHaptic(15);
  }, [triggerHaptic]);

  return {
    isHapticsSupported,
    lightTap,
    mediumTap,
    success,
    error,
    swipe,
    triggerHaptic,
  };
};
