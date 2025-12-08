import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, X, Bookmark } from 'lucide-react';
import { DeckCard } from '../../../types/personalization';
import { SwipeCard } from './SwipeCard';
import { ProgressBar } from './ProgressBar';
import { useHaptics } from '../hooks/useHaptics';
import { useDeckPrefetch } from '../hooks/useDeckPrefetch';
import { analyticsService } from '../services/analyticsService';

interface SwipeDeckProps {
  deck: DeckCard[];
  onSwipe: (
    cardId: string,
    action: 'LIKE' | 'PASS' | 'SAVE',
    interactionType: 'swipe' | 'button',
    swipeVelocity?: number
  ) => void;
  onComplete: () => void;
}

export const SwipeDeck = ({ deck, onSwipe, onComplete }: SwipeDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { swipe } = useHaptics();
  const lastSwipeVelocity = useRef<number>(0);

  // Prefetch next 2 card images
  useDeckPrefetch(deck, currentIndex);

  useEffect(() => {
    if (currentIndex >= deck.length) {
      onComplete();
    }
  }, [currentIndex, deck.length, onComplete]);

  const handleSwipe = (action: 'LIKE' | 'PASS' | 'SAVE', interactionType: 'swipe' | 'button', velocity?: number) => {
    if (isAnimating || currentIndex >= deck.length) return;

    const currentCard = deck[currentIndex];
    setIsAnimating(true);
    swipe();

    // Pass interaction type and velocity to parent
    onSwipe(currentCard.activity_id, action, interactionType, velocity);

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleButtonClick = (action: 'LIKE' | 'PASS' | 'SAVE') => {
    handleSwipe(action, 'button');
  };

  const handleGestureSwipe = (action: 'LIKE' | 'PASS' | 'SAVE', velocity?: number) => {
    handleSwipe(action, 'swipe', velocity);
  };

  if (currentIndex >= deck.length) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-white text-2xl font-bold">
          Preparing your personalized itinerary...
        </div>
      </div>
    );
  }

  // Show next 3 cards for depth effect
  const visibleCards = deck.slice(currentIndex, currentIndex + 3);

  return (
    <div className="min-h-screen bg-game-bg flex flex-col">
      {/* Progress Bar */}
      <ProgressBar current={currentIndex + 1} total={deck.length} />

      {/* Card Stack */}
      <div className="flex-1 relative px-4 py-6">
        <div className="max-w-md mx-auto h-full relative">
          {/* Render cards in reverse order so top card is on top */}
          {visibleCards.reverse().map((card, index) => {
            const reverseIndex = visibleCards.length - 1 - index;
            const isTopCard = reverseIndex === 0;

            return (
              <motion.div
                key={card.id}
                className="absolute inset-0"
                initial={{
                  scale: 1 - reverseIndex * 0.05,
                  y: reverseIndex * 10,
                }}
                animate={{
                  scale: 1 - reverseIndex * 0.05,
                  y: reverseIndex * 10,
                }}
                style={{
                  zIndex: isTopCard ? 20 : 10 - reverseIndex,
                }}
              >
                <SwipeCard
                  card={card}
                  onSwipeLeft={(velocity) => handleGestureSwipe('PASS', velocity)}
                  onSwipeRight={(velocity) => handleGestureSwipe('LIKE', velocity)}
                  isTopCard={isTopCard}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Control Buttons (Thumb Zone) */}
      <div className="p-6 bg-game-card border-t border-gray-700">
        <div className="max-w-md mx-auto flex items-center justify-center gap-4">
          {/* Pass Button */}
          <motion.button
            onClick={() => handleButtonClick('PASS')}
            disabled={isAnimating}
            className="w-16 h-16 rounded-full bg-game-discard text-white flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-8 h-8" strokeWidth={3} />
          </motion.button>

          {/* Save for Later Button */}
          <motion.button
            onClick={() => handleButtonClick('SAVE')}
            disabled={isAnimating}
            className="w-14 h-14 rounded-full bg-game-save text-white flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bookmark className="w-6 h-6" />
          </motion.button>

          {/* Like Button */}
          <motion.button
            onClick={() => handleButtonClick('LIKE')}
            disabled={isAnimating}
            className="w-16 h-16 rounded-full bg-game-accent-green text-white flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className="w-8 h-8 fill-current" strokeWidth={3} />
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-400 mt-4">
          Swipe or tap • Tap ⓘ for details
        </div>
      </div>
    </div>
  );
};
