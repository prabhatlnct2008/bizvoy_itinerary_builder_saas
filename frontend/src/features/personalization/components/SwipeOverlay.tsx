import { motion, MotionValue } from 'framer-motion';
import { Heart, X } from 'lucide-react';

interface SwipeOverlayProps {
  x: MotionValue<number>;
}

export const SwipeOverlay = ({ x }: SwipeOverlayProps) => {
  return (
    <>
      {/* NOPE Overlay (Left) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          opacity: x.get() < -50 ? Math.min(Math.abs(x.get()) / 150, 1) : 0,
        }}
      >
        <div className="bg-game-discard text-white px-8 py-4 rounded-xl transform -rotate-12 border-4 border-white shadow-2xl">
          <div className="flex items-center gap-3">
            <X className="w-8 h-8" strokeWidth={3} />
            <span className="text-3xl font-black">NOPE</span>
          </div>
        </div>
      </motion.div>

      {/* YES Overlay (Right) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          opacity: x.get() > 50 ? Math.min(x.get() / 150, 1) : 0,
        }}
      >
        <div className="bg-game-accent-green text-white px-8 py-4 rounded-xl transform rotate-12 border-4 border-white shadow-2xl">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 fill-current" strokeWidth={3} />
            <span className="text-3xl font-black">YES!</span>
          </div>
        </div>
      </motion.div>
    </>
  );
};
