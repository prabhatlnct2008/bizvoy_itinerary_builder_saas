import { motion } from 'framer-motion';
import { MapPin, Clock, Star } from 'lucide-react';
import { DeckCard } from '../../../types/personalization';
import { SwipeOverlay } from './SwipeOverlay';
import { CardFlip } from './CardFlip';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { cardVariants } from '../animations/cardAnimations';

interface SwipeCardProps {
  card: DeckCard;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTopCard: boolean;
}

export const SwipeCard = ({ card, onSwipeLeft, onSwipeRight, isTopCard }: SwipeCardProps) => {
  const {
    x,
    y,
    rotate,
    handleDragStart,
    handleDragEnd,
  } = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold: 150,
  });

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x,
        y,
        rotate,
        cursor: isTopCard ? 'grab' : 'default',
      }}
      drag={isTopCard}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      variants={cardVariants}
      initial="enter"
      animate="center"
      whileDrag={{ cursor: 'grabbing' }}
    >
      <CardFlip card={card}>
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-game-card">
          {/* Hero Image */}
          <div className="absolute inset-0">
            <img
              src={card.image_url}
              alt={card.name}
              className="w-full h-full object-cover"
            />

            {/* Gradient overlay (bottom 35%) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>

          {/* Swipe Overlays */}
          {isTopCard && <SwipeOverlay x={x} />}

          {/* Marketing Badge (top-left) */}
          {card.marketing_badge && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-game-accent-coral text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                {card.marketing_badge}
              </div>
            </div>
          )}

          {/* Card Content (bottom) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            {/* Title */}
            <h2 className="text-white text-3xl font-bold mb-3 leading-tight">
              {card.name}
            </h2>

            {/* Location */}
            <div className="flex items-center gap-2 text-white/90 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{card.location}</span>
            </div>

            {/* Duration & Rating */}
            <div className="flex items-center gap-4 mb-4">
              {/* Duration */}
              <div className="flex items-center gap-2 text-white/90">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{card.duration_display}</span>
              </div>

              {/* Rating */}
              {card.review_rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-white text-sm font-semibold">
                    {card.review_rating}
                  </span>
                  {card.review_count && (
                    <span className="text-white/70 text-sm">
                      ({card.review_count})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Short Description */}
            <p className="text-white/80 text-sm mb-4 line-clamp-2">
              {card.short_description}
            </p>

            {/* Price */}
            <div className="inline-flex items-center bg-game-accent-green text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
              {card.currency_code} {card.price_numeric.toFixed(2)}
            </div>
          </div>
        </div>
      </CardFlip>
    </motion.div>
  );
};
