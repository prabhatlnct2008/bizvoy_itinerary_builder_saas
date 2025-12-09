import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { RevealResponse, MissedItem, FittedItem } from '../../../types/personalization';
import { TimelineDay } from './TimelineDay';
import { MissedConnections } from './MissedConnections';
import { SwapModal } from './SwapModal';
import { SavedForLater } from './SavedForLater';
import { ConfirmFooter } from './ConfirmFooter';
import { triggerCelebrationConfetti } from '../animations/confetti';

interface RevealTimelineProps {
  revealData: RevealResponse;
  onConfirm: () => void;
  onSwap: (removeActivityId: string, addActivityId: string) => Promise<void>;
  isLoading?: boolean;
}

export const RevealTimeline = ({
  revealData,
  onConfirm,
  onSwap,
  isLoading = false,
}: RevealTimelineProps) => {
  const [selectedMissedItem, setSelectedMissedItem] = useState<MissedItem | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // Normalize optional fields to avoid crashes on minimal payloads
  const fittedItems = revealData.fitted_items || [];
  const missedItems = revealData.missed_items || [];
  const savedItems = (revealData as any).saved_items || [];

  // Trigger confetti on mount
  useEffect(() => {
    triggerCelebrationConfetti();
  }, []);

  // Group fitted items by day
  const groupedByDay = fittedItems.reduce((acc, item) => {
    const dayNum = item.day_number;
    if (!acc[dayNum]) {
      acc[dayNum] = {
        day_number: dayNum,
        day_date: item.day_date,
        activities: [],
      };
    }
    acc[dayNum].activities.push(item);
    return acc;
  }, {} as Record<number, { day_number: number; day_date: string; activities: FittedItem[] }>);

  const days = Object.values(groupedByDay).sort((a, b) => a.day_number - b.day_number);

  const handleSwapClick = (missedItem: MissedItem) => {
    setSelectedMissedItem(missedItem);
    setIsSwapModalOpen(true);
  };

  const handleConfirmSwap = async () => {
    if (!selectedMissedItem?.swap_suggestion?.swap_with_activity_id) return;

    setIsSwapping(true);
    try {
      await onSwap(
        selectedMissedItem.swap_suggestion.swap_with_activity_id,
        selectedMissedItem.activity_id
      );
      setIsSwapModalOpen(false);
      setSelectedMissedItem(null);
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="min-h-screen bg-game-bg pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-game-accent-green to-game-bg py-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-white" />
          <h1 className="text-white text-4xl font-bold mb-3">
            Your Trip is Ready!
          </h1>
          <p className="text-white text-lg opacity-90">
            We've added {fittedItems.length} personalized activities
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h2 className="text-white text-2xl font-bold mb-6">Your Itinerary</h2>

          {days.map((day) => (
            <TimelineDay
              key={day.day_number}
              dayNumber={day.day_number}
              dayDate={day.day_date}
              activities={day.activities}
            />
          ))}
        </motion.div>

        {/* Saved for Later */}
        {savedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <SavedForLater savedItems={savedItems} />
          </motion.div>
        )}
      </div>

      {/* Missed Connections (Bottom Sheet) */}
      <MissedConnections
        missedItems={missedItems}
        onSwapClick={handleSwapClick}
      />

      {/* Swap Modal */}
      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        missedItem={selectedMissedItem}
        onConfirmSwap={handleConfirmSwap}
        isLoading={isSwapping}
      />

      {/* Confirm Footer */}
      <ConfirmFooter
        totalAdded={revealData.total_added_price}
        currencyCode={revealData.currency_code}
        onConfirm={onConfirm}
        isLoading={isLoading}
      />
    </div>
  );
};
