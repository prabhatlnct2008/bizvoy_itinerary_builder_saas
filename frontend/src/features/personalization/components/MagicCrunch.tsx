import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';

const loadingMessages = [
  'Checking opening hours...',
  'Finding travel routes...',
  'Optimizing your schedule...',
  'Matching your preferences...',
  'Creating the perfect day...',
];

export const MagicCrunch = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [pins, setPins] = useState<{ id: number; x: number; y: number; liked: boolean }[]>([]);

  useEffect(() => {
    // Rotate through loading messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    // Animate pins dropping
    const pinInterval = setInterval(() => {
      setPins((prev) => {
        if (prev.length >= 8) return prev;
        return [
          ...prev,
          {
            id: prev.length,
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
            liked: Math.random() > 0.3, // 70% liked, 30% locked
          },
        ];
      });
    }, 400);

    return () => {
      clearInterval(messageInterval);
      clearInterval(pinInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6">
      {/* Map Container */}
      <div className="relative w-full max-w-md aspect-square mb-8">
        {/* Stylized Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden">
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Animated Pins */}
          <AnimatePresence>
            {pins.map((pin, index) => (
              <motion.div
                key={pin.id}
                className="absolute"
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                }}
                initial={{ scale: 0, y: -50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 25,
                  delay: index * 0.1,
                }}
              >
                <div className={`w-8 h-8 ${pin.liked ? 'text-game-accent-green' : 'text-gray-500'}`}>
                  <MapPin className="w-full h-full fill-current" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Connecting Lines (Polylines) */}
          {pins.length > 1 && (
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {pins.slice(0, -1).map((pin, index) => {
                const nextPin = pins[index + 1];
                return (
                  <motion.line
                    key={`line-${pin.id}`}
                    x1={`${pin.x}%`}
                    y1={`${pin.y}%`}
                    x2={`${nextPin.x}%`}
                    y2={`${nextPin.y}%`}
                    stroke="#00E676"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Loading Spinner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="mb-6"
      >
        <Loader2 className="w-12 h-12 text-game-accent-green" />
      </motion.div>

      {/* Loading Messages */}
      <div className="text-center">
        <h2 className="text-white text-2xl font-bold mb-4">
          Working our magic...
        </h2>

        <div className="h-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-gray-300 text-lg"
            >
              {loadingMessages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
