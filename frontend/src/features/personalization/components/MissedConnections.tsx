import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { MissedItem } from '../../../types/personalization';

interface MissedConnectionsProps {
  missedItems: MissedItem[];
  onSwapClick: (missedItem: MissedItem) => void;
}

export const MissedConnections = ({ missedItems, onSwapClick }: MissedConnectionsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (missedItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-game-card border-t-2 border-yellow-500 shadow-2xl z-40">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-all"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-500" />
          <div className="text-left">
            <h3 className="text-white font-bold text-lg">
              Missed Connections ({missedItems.length})
            </h3>
            <p className="text-gray-400 text-sm">
              Activities that didn't fit
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-4 pt-0 max-h-64 overflow-y-auto space-y-3">
          {missedItems.map((item) => (
            <div
              key={item.activity_id}
              className="bg-gray-700 rounded-lg p-4 flex items-start gap-3"
            >
              {/* Image */}
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm mb-1">
                  {item.name}
                </h4>
                <p className="text-gray-400 text-xs mb-2">
                  {item.miss_reason}
                </p>
                <div className="text-xs text-gray-500">
                  {item.duration_display} • {item.currency_code}{' '}
                  {item.price_numeric.toFixed(2)}
                </div>
              </div>

              {/* Swap Button */}
              {item.swap_suggestion?.can_swap && (
                <button
                  onClick={() => onSwapClick(item)}
                  className="flex-shrink-0 px-3 py-2 bg-game-accent-green text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-all flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Swap</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
