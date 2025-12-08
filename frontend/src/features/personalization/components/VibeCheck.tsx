import { useState } from 'react';
import { motion } from 'framer-motion';
import { AgencyVibe } from '../../../types/personalization';
import { VibeBubble } from './VibeBubble';
import { analyticsService } from '../services/analyticsService';

interface VibeCheckProps {
  vibes: AgencyVibe[];
  destination: string;
  onContinue: (selectedVibes: string[]) => void;
}

export const VibeCheck = ({ vibes, destination, onContinue }: VibeCheckProps) => {
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const handleVibeSelect = (vibeKey: string) => {
    setSelectedVibes((prev) => {
      if (prev.includes(vibeKey)) {
        // Deselect
        const newVibes = prev.filter((v) => v !== vibeKey);
        analyticsService.trackVibeDeselect(vibeKey, newVibes);
        return newVibes;
      } else {
        // Select (max 3)
        if (prev.length >= 3) {
          return prev;
        }
        const newVibes = [...prev, vibeKey];
        analyticsService.trackVibeSelect(vibeKey, newVibes);
        return newVibes;
      }
    });
  };

  const handleContinue = () => {
    if (selectedVibes.length > 0) {
      onContinue(selectedVibes);
    }
  };

  return (
    <div className="min-h-screen bg-game-bg text-white flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <motion.h1
          className="text-4xl font-bold mb-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          What's your {destination} vibe?
        </motion.h1>
        <motion.p
          className="text-lg text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Select up to 3
        </motion.p>

        {/* Selection counter */}
        <motion.div
          className="mt-4 inline-flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                selectedVibes.length > index
                  ? 'bg-game-accent-green scale-100'
                  : 'bg-gray-600 scale-75'
              }`}
            />
          ))}
        </motion.div>
      </div>

      {/* Vibes Grid */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vibes.map((vibe, index) => (
            <VibeBubble
              key={vibe.id}
              vibe={vibe}
              isSelected={selectedVibes.includes(vibe.vibe_key)}
              onSelect={handleVibeSelect}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <div className="p-6 bg-game-card border-t border-gray-700">
        <motion.button
          onClick={handleContinue}
          disabled={selectedVibes.length === 0}
          className={`
            w-full py-4 rounded-xl font-bold text-lg
            transition-all duration-300
            ${selectedVibes.length > 0
              ? 'bg-game-accent-green text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
          whileHover={selectedVibes.length > 0 ? { scale: 1.02 } : {}}
          whileTap={selectedVibes.length > 0 ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {selectedVibes.length > 0
            ? `Build My Deck (${selectedVibes.length} vibe${selectedVibes.length > 1 ? 's' : ''})`
            : 'Select at least 1 vibe'}
        </motion.button>
      </div>
    </div>
  );
};
