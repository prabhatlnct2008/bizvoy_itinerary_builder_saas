import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';

interface PersonalizationEntryProps {
  token: string;
}

export const PersonalizationEntry = ({ token }: PersonalizationEntryProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/itinerary/${token}/personalize`);
  };

  return (
    <div className="my-8">
      {/* Quick Personalization Badge - per spec */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            This trip supports quick personalization
          </span>
        </div>
      </div>

      <motion.button
        onClick={handleClick}
        className="relative w-full py-6 px-8 rounded-xl overflow-hidden bg-gradient-to-r from-game-accent-green to-game-accent-coral text-white font-semibold text-lg shadow-lg"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(0, 230, 118, 0.5)',
            '0 0 40px rgba(0, 230, 118, 0.8)',
            '0 0 20px rgba(0, 230, 118, 0.5)',
          ],
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Content - Updated copy per spec */}
        <div className="relative flex items-center justify-center gap-3">
          <Sparkles className="w-6 h-6" />
          <div className="text-center">
            <div className="text-xl font-bold">Personalize Trip</div>
            <div className="text-sm font-normal opacity-90 mt-1">
              20 quick choices • ~60 seconds
            </div>
          </div>
          <Sparkles className="w-6 h-6" />
        </div>
      </motion.button>

      <p className="text-center text-sm text-text-secondary mt-3">
        Swipe through activities to customize your itinerary
      </p>
    </div>
  );
};
