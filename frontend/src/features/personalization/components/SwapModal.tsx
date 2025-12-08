import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft } from 'lucide-react';
import { MissedItem } from '../../../types/personalization';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  missedItem: MissedItem | null;
  onConfirmSwap: () => void;
  isLoading?: boolean;
}

export const SwapModal = ({
  isOpen,
  onClose,
  missedItem,
  onConfirmSwap,
  isLoading = false,
}: SwapModalProps) => {
  if (!missedItem?.swap_suggestion?.can_swap) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-75 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-game-card rounded-2xl p-6 z-50 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-game-accent-green bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRightLeft className="w-8 h-8 text-game-accent-green" />
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">Swap Activity?</h2>
              <p className="text-gray-400 text-sm">
                {missedItem.swap_suggestion.swap_reason}
              </p>
            </div>

            {/* Swap Details */}
            <div className="space-y-4 mb-6">
              {/* Remove */}
              <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4">
                <div className="text-xs text-red-400 mb-1">REMOVE</div>
                <div className="text-white font-semibold">
                  {missedItem.swap_suggestion.swap_with_activity_name}
                </div>
              </div>

              {/* Add */}
              <div className="bg-game-accent-green bg-opacity-10 border border-game-accent-green rounded-lg p-4">
                <div className="text-xs text-game-accent-green mb-1">ADD</div>
                <div className="text-white font-semibold">{missedItem.name}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {missedItem.duration_display} • {missedItem.currency_code}{' '}
                  {missedItem.price_numeric.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmSwap}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-game-accent-green text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Swapping...' : 'Confirm Swap'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
