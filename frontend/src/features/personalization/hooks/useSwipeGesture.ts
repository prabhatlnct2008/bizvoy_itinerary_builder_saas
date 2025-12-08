import { useState, useCallback } from 'react';
import { useMotionValue, useTransform } from 'framer-motion';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

/**
 * Custom hook for swipe gesture tracking
 * Provides drag position, rotation, and swipe detection
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 150,
}: SwipeGestureOptions) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number>(0);

  // Motion values for position and rotation
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotation based on X position (max 15 degrees)
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);

  // Opacity for swipe overlays
  const opacity = useTransform(x, [-threshold, 0, threshold], [1, 0, 1]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setDragStartTime(Date.now());
  }, []);

  const handleDragEnd = useCallback(
    (_event: any, info: { offset: { x: number; y: number }; velocity: { x: number } }) => {
      setIsDragging(false);

      const swipeVelocity = info.velocity.x;
      const offsetX = info.offset.x;

      // Calculate swipe based on distance or velocity
      const shouldSwipe = Math.abs(offsetX) > threshold || Math.abs(swipeVelocity) > 500;

      if (shouldSwipe) {
        if (offsetX > 0) {
          // Swipe right (LIKE)
          onSwipeRight?.();
        } else {
          // Swipe left (PASS)
          onSwipeLeft?.();
        }
      } else {
        // Snap back to center
        x.set(0);
        y.set(0);
      }
    },
    [threshold, onSwipeLeft, onSwipeRight, x, y]
  );

  const getSwipeVelocity = useCallback(() => {
    const currentX = x.get();
    const elapsed = Date.now() - dragStartTime;
    return elapsed > 0 ? Math.abs(currentX / elapsed) : 0;
  }, [x, dragStartTime]);

  const resetPosition = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {
    x,
    y,
    rotate,
    opacity,
    isDragging,
    handleDragStart,
    handleDragEnd,
    getSwipeVelocity,
    resetPosition,
  };
};
