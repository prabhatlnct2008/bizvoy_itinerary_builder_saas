import { motion, useTransform } from 'framer-motion';
import { MapPin, Clock, Star, Info } from 'lucide-react';
import { DeckCard } from '../../../types/personalization';
import { CardFlip } from './CardFlip';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { cardVariants } from '../animations/cardAnimations';

interface SwipeCardProps {
  card: DeckCard;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTopCard: boolean;
}

// Placeholder image for activities without hero images
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1200&fit=crop';

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

  // Transform for overlay opacity based on drag position
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Format price display - show as addition to trip
  const priceLabel = card.price_numeric !== null && card.price_numeric !== undefined && card.price_numeric > 0
    ? `+$${card.price_numeric.toFixed(0)}`
    : card.price_display || 'Included';

  // Get hero image with fallback
  const heroImage = card.hero_image_url || PLACEHOLDER_IMAGE;

  // Format duration display
  const durationDisplay = '2-3 Hours';

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
      dragElastic={0.9}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      variants={cardVariants}
      initial="enter"
      animate="center"
      whileDrag={{ cursor: 'grabbing' }}
    >
      <CardFlip card={card}>
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-game-card">
          {/* Full-bleed Hero Image */}
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={card.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
              }}
            />

            {/* Gradient overlay - darker at bottom (35%) for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 via-[35%] to-transparent" />
          </div>

          {/* LIKE Overlay (swipe right) - Green wash */}
          {isTopCard && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              style={{ opacity: likeOpacity }}
            >
              <div className="absolute inset-0 bg-game-accent-green/25" />
              <div className="bg-game-accent-green text-white px-10 py-5 rounded-2xl transform rotate-12 border-4 border-white shadow-2xl">
                <span className="text-4xl font-black tracking-wide">YES!</span>
              </div>
            </motion.div>
          )}

          {/* NOPE Overlay (swipe left) - Red wash */}
          {isTopCard && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              style={{ opacity: nopeOpacity }}
            >
              <div className="absolute inset-0 bg-game-discard/25" />
              <div className="bg-game-discard text-white px-10 py-5 rounded-2xl transform -rotate-12 border-4 border-white shadow-2xl">
                <span className="text-4xl font-black tracking-wide">NOPE</span>
              </div>
            </motion.div>
          )}

          {/* Marketing Badge (top-left) - Glassmorphism */}
          {card.marketing_badge && (
            <div className="absolute top-5 left-5 z-10">
              <div className="backdrop-blur-xl bg-white/20 border border-white/30 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                <span>🔥</span>
                <span>{card.marketing_badge}</span>
              </div>
            </div>
          )}

          {/* Category Badge (top-right) */}
          {card.category_label && (
            <div className="absolute top-5 right-5 z-10">
              <div className="backdrop-blur-xl bg-black/40 border border-white/20 text-white/90 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide">
                {card.category_label}
              </div>
            </div>
          )}

          {/* Tap for Info indicator */}
          <div className="absolute top-1/2 right-4 z-10 transform -translate-y-1/2">
            <div className="backdrop-blur-xl bg-white/15 border border-white/20 p-3 rounded-full shadow-lg">
              <Info className="w-5 h-5 text-white/80" />
            </div>
          </div>

          {/* Card Content (bottom) - Rich Content Layer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            {/* Title - Large H1, Bold, High contrast */}
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4 leading-tight drop-shadow-lg">
              {card.name}
            </h2>

            {/* Social Proof Row */}
            <div className="flex items-center flex-wrap gap-3 mb-4">
              {/* Rating with yellow stars */}
              {card.rating && card.rating > 0 && (
                <div className="flex items-center gap-1.5 backdrop-blur-sm bg-black/30 px-3 py-1.5 rounded-full">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-white font-bold text-base">
                    {card.rating.toFixed(1)}
                  </span>
                  {card.review_count > 0 && (
                    <span className="text-white/70 text-sm">
                      ({card.review_count})
                    </span>
                  )}
                </div>
              )}

              {/* Vibe Tags as pills */}
              {card.vibe_tags && card.vibe_tags.length > 0 && (
                <div className="flex items-center gap-2">
                  {card.vibe_tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="backdrop-blur-sm bg-game-accent-green/25 text-game-accent-green border border-game-accent-green/30 px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Logistics Row - Duration & Location */}
            <div className="flex items-center flex-wrap gap-3 mb-4 text-white/90">
              {/* Duration */}
              <div className="flex items-center gap-2 backdrop-blur-sm bg-black/30 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{durationDisplay}</span>
              </div>

              {/* Location */}
              {card.location_display && (
                <div className="flex items-center gap-2 backdrop-blur-sm bg-black/30 px-3 py-1.5 rounded-full">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium truncate max-w-[160px]">
                    {card.location_display}
                  </span>
                </div>
              )}
            </div>

            {/* Short Description */}
            {card.short_description && (
              <p className="text-white/85 text-sm mb-5 line-clamp-2 leading-relaxed">
                {card.short_description}
              </p>
            )}

            {/* Price - Large, Electric Green */}
            <div className="inline-flex items-center">
              <div className="bg-game-accent-green text-white px-5 py-2.5 rounded-xl font-bold text-xl shadow-lg shadow-game-accent-green/40">
                {priceLabel}
              </div>
            </div>
          </div>
        </div>
      </CardFlip>
    </motion.div>
  );
};
