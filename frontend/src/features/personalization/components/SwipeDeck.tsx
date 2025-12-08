import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, X, Bookmark } from 'lucide-react';
import { DeckCard } from '../../../types/personalization';
import { SwipeCard } from './SwipeCard';
import { ProgressBar } from './ProgressBar';
import { useHaptics } from '../hooks/useHaptics';
import { useDeckPrefetch } from '../hooks/useDeckPrefetch';

interface SwipeDeckProps {
  deck: DeckCard[];
  onSwipe: (cardId: string, action: 'LIKE' | 'PASS' | 'SAVE') => void;
  onComplete: () => void;
}

export const SwipeDeck = ({ deck, onSwipe, onComplete }: SwipeDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { swipe } = useHaptics();

  // Prefetch next 2 card images
  useDeckPrefetch(deck, currentIndex);

  useEffect(() => {
    if (currentIndex >= deck.length) {
      onComplete();
    }
  }, [currentIndex, deck.length, onComplete]);

  const handleSwipe = (action: 'LIKE' | 'PASS' | 'SAVE') => {
    if (isAnimating || currentIndex >= deck.length) return;

    const currentCard = deck[currentIndex];
    setIsAnimating(true);
    swipe();

    onSwipe(currentCard.activity_id, action);

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleButtonClick = (action: 'LIKE' | 'PASS' | 'SAVE') => {
    handleSwipe(action);
  };

  if (currentIndex >= deck.length) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-center px-8">
          <div className="text-white text-2xl font-bold mb-3">
            Creating your perfect trip...
          </div>
          <div className="text-white/50 text-sm">
            Fitting your selections into the itinerary
          </div>
        </div>
      </div>
    );
  }

  // Show next 3 cards for depth effect
  const visibleCards = deck.slice(currentIndex, currentIndex + 3);

  return (
    <div className="min-h-screen bg-game-bg flex flex-col">
      {/* Progress Bar - Thin, integrated at top */}
      <ProgressBar current={currentIndex + 1} total={deck.length} />

      {/* Card Stack - Takes up most of screen height for immersive experience */}
      <div className="flex-1 relative px-4 pt-2 pb-4">
        <div
          className="max-w-md mx-auto h-full relative"
          style={{ minHeight: 'calc(100vh - 220px)' }}
        >
          {/* Render cards in reverse order so top card is on top */}
          {[...visibleCards].reverse().map((card, index) => {
            const reverseIndex = visibleCards.length - 1 - index;
            const isTopCard = reverseIndex === 0;

            return (
              <motion.div
                key={card.activity_id}
                className="absolute inset-0"
                initial={{
                  scale: 1 - reverseIndex * 0.04,
                  y: reverseIndex * 12,
                }}
                animate={{
                  scale: 1 - reverseIndex * 0.04,
                  y: reverseIndex * 12,
                }}
                style={{
                  zIndex: isTopCard ? 20 : 10 - reverseIndex,
                }}
              >
                <SwipeCard
                  card={card}
                  onSwipeLeft={() => handleSwipe('PASS')}
                  onSwipeRight={() => handleSwipe('LIKE')}
                  isTopCard={isTopCard}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Control Buttons (Thumb Zone) - Bold, High-contrast, Thumb-friendly sizing */}
      <div className="px-6 py-5 bg-gradient-to-t from-game-bg via-game-bg to-transparent">
        <div className="max-w-md mx-auto flex items-center justify-center gap-6">
          {/* Pass Button (X) - Large with glow effect */}
          <motion.button
            onClick={() => handleButtonClick('PASS')}
            disabled={isAnimating}
            className="w-[72px] h-[72px] rounded-full bg-game-discard text-white flex items-center justify-center shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border-4 border-game-discard/20"
            whileHover={{
              scale: 1.1,
              boxShadow: '0 0 30px rgba(255, 82, 82, 0.5)'
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <X className="w-9 h-9" strokeWidth={3} />
          </motion.button>

          {/* Save for Later Button - Medium size */}
          <motion.button
            onClick={() => handleButtonClick('SAVE')}
            disabled={isAnimating}
            className="w-14 h-14 rounded-full bg-game-save text-white flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-game-save/20"
            whileHover={{
              scale: 1.1,
              boxShadow: '0 0 20px rgba(255, 193, 7, 0.5)'
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Bookmark className="w-6 h-6" />
          </motion.button>

          {/* Like Button (Heart) - Large with glow effect */}
          <motion.button
            onClick={() => handleButtonClick('LIKE')}
            disabled={isAnimating}
            className="w-[72px] h-[72px] rounded-full bg-game-accent-green text-white flex items-center justify-center shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border-4 border-game-accent-green/20"
            whileHover={{
              scale: 1.1,
              boxShadow: '0 0 30px rgba(0, 230, 118, 0.6)'
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Heart className="w-9 h-9 fill-current" strokeWidth={2} />
          </motion.button>
        </div>

        {/* Instructions - Subtle hint */}
        <div className="text-center text-xs text-white/40 mt-4 tracking-wide">
          Swipe right to keep • Swipe left to pass • Tap card for details
        </div>
      </div>
    </div>
  );
};
