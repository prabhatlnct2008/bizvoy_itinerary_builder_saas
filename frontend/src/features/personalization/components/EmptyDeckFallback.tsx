import { motion } from 'framer-motion';
import { PackageX, ArrowLeft, RefreshCw, Home } from 'lucide-react';

interface EmptyDeckFallbackProps {
  onBackToVibes: () => void;
  onBackToItinerary: () => void;
}

export const EmptyDeckFallback = ({
  onBackToVibes,
  onBackToItinerary,
}: EmptyDeckFallbackProps) => {
  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <motion.div
          className="w-24 h-24 rounded-full bg-game-card mx-auto mb-6 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <PackageX className="w-12 h-12 text-gray-400" />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-2xl font-bold text-white mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          No Activities Available
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-gray-300 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          We couldn't find any activities matching your selected vibes.
        </motion.p>

        {/* Suggestions */}
        <motion.div
          className="bg-game-card rounded-xl p-4 mb-6 text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-400 text-sm mb-3">This might happen because:</p>
          <ul className="text-gray-300 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-game-accent-coral mt-1">•</span>
              <span>Activities haven't been set up for personalization yet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-accent-coral mt-1">•</span>
              <span>Your selected vibes don't match any available activities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-accent-coral mt-1">•</span>
              <span>Activities need more details before they can be shown</span>
            </li>
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={onBackToVibes}
            className="w-full py-4 px-6 rounded-xl bg-game-accent-green text-white font-semibold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Different Vibes
          </button>

          <button
            onClick={onBackToItinerary}
            className="w-full py-4 px-6 rounded-xl bg-game-card text-gray-300 font-medium flex items-center justify-center gap-2 hover:bg-opacity-80 transition-colors border border-gray-600"
          >
            <Home className="w-5 h-5" />
            Back to Itinerary
          </button>
        </motion.div>

        {/* Contact info */}
        <motion.p
          className="text-gray-500 text-xs mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          If this issue persists, please contact your travel agent.
        </motion.p>
      </motion.div>
    </div>
  );
};
