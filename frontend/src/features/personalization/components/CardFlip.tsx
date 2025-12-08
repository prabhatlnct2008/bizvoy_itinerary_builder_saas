import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Clock, Star, Tag } from 'lucide-react';
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
          onClick={handleFlip}
        >
          {children}
        </div>

        {/* Back of card - Full details view */}
        <div
          className="absolute inset-0 bg-game-card rounded-3xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Hero image header */}
          <div className="relative h-48">
            <img
              src={card.hero_image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop'}
              alt={card.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-game-card via-game-card/50 to-transparent" />

            {/* Close button */}
            <button
              onClick={handleFlip}
              className="absolute top-4 right-4 w-10 h-10 backdrop-blur-xl bg-black/40 border border-white/20 rounded-full flex items-center justify-center hover:bg-black/60 transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Title on image */}
            <div className="absolute bottom-4 left-6 right-6">
              <h2 className="text-white text-2xl font-bold drop-shadow-lg">{card.name}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100% - 12rem)' }}>
            <div className="text-white space-y-5">
              {/* Quick info row */}
              <div className="flex flex-wrap gap-3">
                {card.rating && card.rating > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{card.rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-white/70" />
                  <span className="text-sm">2-3 Hours</span>
                </div>
                {card.location_display && (
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                    <MapPin className="w-4 h-4 text-white/70" />
                    <span className="text-sm truncate max-w-[120px]">{card.location_display}</span>
                  </div>
                )}
              </div>

              {/* Category */}
              {card.category_label && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-game-accent-green" />
                  <span className="text-sm text-white/80 capitalize">{card.category_label}</span>
                </div>
              )}

              {/* Description */}
              {card.client_description && (
                <div>
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                    About this experience
                  </h3>
                  <p className="text-sm text-white/90 leading-relaxed">
                    {card.client_description}
                  </p>
                </div>
              )}

              {/* Highlights */}
              {card.highlights && card.highlights.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                    Highlights
                  </h3>
                  <ul className="space-y-2">
                    {card.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-game-accent-green mt-0.5">✓</span>
                        <span className="text-sm text-white/90">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Vibe Tags */}
              {card.vibe_tags && card.vibe_tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                    Vibes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {card.vibe_tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-game-accent-green/20 text-game-accent-green px-3 py-1 rounded-full text-xs font-medium capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Added to trip</span>
                  <span className="text-game-accent-green font-bold text-xl">
                    {card.price_numeric && card.price_numeric > 0
                      ? `+$${card.price_numeric.toFixed(0)}`
                      : card.price_display || 'Included'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
