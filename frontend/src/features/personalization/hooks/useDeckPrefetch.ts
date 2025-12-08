import { useEffect } from 'react';
import { DeckCard } from '../../../types/personalization';

/**
 * Custom hook for preloading images for the next 2 cards in the deck
 * Improves UX by ensuring images are loaded before user swipes
 */
export const useDeckPrefetch = (deck: DeckCard[], currentIndex: number) => {
  useEffect(() => {
    // Prefetch images for the next 2 cards
    const prefetchCount = 2;
    const imagesToPrefetch: string[] = [];

    for (let i = 1; i <= prefetchCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < deck.length && deck[nextIndex].hero_image_url) {
        imagesToPrefetch.push(deck[nextIndex].hero_image_url);
      }
    }

    // Preload each image
    imagesToPrefetch.forEach((imageUrl) => {
      const img = new Image();
      img.src = imageUrl;
    });
  }, [deck, currentIndex]);
};
