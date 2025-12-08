import { motion } from 'framer-motion';
import { AgencyVibe } from '../../../types/personalization';
import { bubbleVariants } from '../animations/bubbleAnimations';

interface VibeBubbleProps {
  vibe: AgencyVibe;
  isSelected: boolean;
  onSelect: (vibeKey: string) => void;
  index: number;
}

export const VibeBubble = ({ vibe, isSelected, onSelect, index }: VibeBubbleProps) => {
  return (
    <motion.button
      custom={index}
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      onClick={() => onSelect(vibe.vibe_key)}
      className={`
        relative px-6 py-4 rounded-full
        flex items-center gap-3
        transition-all duration-300
        ${isSelected
          ? 'bg-game-accent-green text-white ring-4 ring-game-accent-green ring-opacity-50'
          : 'bg-white text-text-primary hover:bg-gray-50'
        }
        shadow-lg cursor-pointer select-none
      `}
      style={{
        backgroundColor: isSelected ? vibe.color_hex : undefined,
      }}
    >
      {/* Emoji */}
      <span className="text-2xl">{vibe.emoji}</span>

      {/* Label */}
      <span className="font-semibold text-lg">{vibe.display_name}</span>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <svg
            className="w-4 h-4 text-game-accent-green"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      )}

      {/* Floating animation */}
      <motion.div
        className="absolute inset-0"
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 2 + index * 0.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.button>
  );
};
