import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ConfirmFooterProps {
  totalAdded: number;
  currencyCode: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmFooter = ({
  totalAdded,
  currencyCode,
  onConfirm,
  isLoading = false,
}: ConfirmFooterProps) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-game-card border-t-2 border-game-accent-green p-4 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Total */}
        <div>
          <div className="text-gray-400 text-sm">Added to your trip</div>
          <div className="text-white text-2xl font-bold">
            {currencyCode} {totalAdded.toFixed(2)}
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
          <span>{isLoading ? 'Processing...' : 'Confirm & Pay'}</span>
          {!isLoading && <ArrowRight className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  );
};
