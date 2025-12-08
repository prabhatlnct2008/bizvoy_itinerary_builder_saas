import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const progress = (current / total) * 100;

  return (
    <div className="w-full px-6 py-4">
      {/* Progress text */}
      <div className="text-center text-sm text-white mb-2">
        Reviewing {current} of {total}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-game-accent-green"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
