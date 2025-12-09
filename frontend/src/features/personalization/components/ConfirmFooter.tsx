import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ConfirmFooterProps {
  totalAdded?: number | null;
  currencyCode?: string | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmFooter = ({
  totalAdded,
  currencyCode,
  onConfirm,
  isLoading = false,
}: ConfirmFooterProps) => {
  const total = typeof totalAdded === 'number' ? totalAdded : 0;
  const currency = currencyCode || '';

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-game-card border-t-2 border-game-accent-green p-4 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Total */}
        <div>
          <div className="text-gray-400 text-sm">Activities added to your trip</div>
          <div className="text-white text-2xl font-bold">
            {currency} {total.toFixed(2)}
          </div>
        </div>

        {/* Confirm Button */}
        <motion.button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-8 py-4 bg-game-accent-green text-white rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{isLoading ? 'Adding...' : 'Add to Itinerary'}</span>
          {!isLoading && <Check className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  );
};
