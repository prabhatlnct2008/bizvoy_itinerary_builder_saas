import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bookmark } from 'lucide-react';
import { SavedItem } from '../../../types/personalization';

interface SavedForLaterProps {
  savedItems: SavedItem[];
}

export const SavedForLater = ({ savedItems }: SavedForLaterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (savedItems.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-game-save bg-opacity-20 border-2 border-game-save rounded-lg hover:bg-opacity-30 transition-all"
      >
        <div className="flex items-center gap-3">
          <Bookmark className="w-5 h-5 text-game-save" />
          <div className="text-left">
            <h3 className="text-white font-bold text-base">
              Saved for Later ({savedItems.length})
            </h3>
            <p className="text-gray-400 text-sm">
              Activities you bookmarked
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Saved Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-3 space-y-3"
          >
            {savedItems.map((item) => (
              <div
                key={item.activity_id}
                className="bg-game-card rounded-lg p-4 flex items-start gap-3"
              >
                {/* Image */}
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-base mb-2">
                    {item.name}
                  </h4>
                  <div className="text-sm text-gray-400 mb-1">
                    {item.duration_display}
                  </div>
                  <div className="text-sm text-game-save font-semibold">
                    {item.currency_code} {item.price_numeric.toFixed(2)}
                  </div>
                </div>

                {/* Bookmark Icon */}
                <Bookmark className="w-5 h-5 text-game-save fill-current flex-shrink-0" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
