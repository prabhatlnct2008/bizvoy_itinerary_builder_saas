import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { DeckCard } from '../../../types/personalization';
import { cardFlipVariants } from '../animations/cardAnimations';

interface CardFlipProps {
  card: DeckCard;
  children: React.ReactNode;
}

export const CardFlip = ({ card, children }: CardFlipProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative w-full h-full"
        animate={isFlipped ? 'back' : 'front'}
        variants={cardFlipVariants}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {children}

          {/* Info button */}
          <button
            onClick={handleFlip}
            className="absolute top-4 right-4 w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all z-10"
          >
            <Info className="w-6 h-6 text-game-card" />
          </button>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 bg-game-card rounded-2xl p-6 overflow-y-auto"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleFlip}
            className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center hover:bg-opacity-20 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Card details */}
          <div className="text-white pt-8">
            <h2 className="text-2xl font-bold mb-4">{card.name}</h2>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                  About
                </h3>
                <p className="text-base leading-relaxed">{card.detailed_description}</p>
              </div>

              {/* Highlights */}
              {card.highlights && card.highlights.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                    Highlights
                  </h3>
                  <ul className="space-y-2">
                    {card.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-game-accent-green mt-1">•</span>
                        <span className="text-sm">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <div className="text-sm text-gray-400">Duration</div>
                  <div className="font-semibold">{card.duration_display}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Category</div>
                  <div className="font-semibold">{card.category}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
