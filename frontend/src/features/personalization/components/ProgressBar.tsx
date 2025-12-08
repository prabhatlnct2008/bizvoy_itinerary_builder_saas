import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const progress = (current / total) * 100;

  return (
    <div className="w-full px-4 pt-4 pb-2">
      {/* Progress text - subtle, minimal */}
      <div className="text-center text-xs text-white/50 mb-2 tracking-wide">
        {current} of {total}
      </div>

      {/* Progress bar - thin line, integrated into design */}
      <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-game-accent-green/80 to-game-accent-green"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
