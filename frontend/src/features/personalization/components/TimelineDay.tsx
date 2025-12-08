import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar } from 'lucide-react';
import { FittedItem } from '../../../types/personalization';
import { TimelineActivity } from './TimelineActivity';
import { format } from 'date-fns';

interface TimelineDayProps {
  dayNumber: number;
  dayDate: string;
  activities: FittedItem[];
}

export const TimelineDay = ({ dayNumber, dayDate, activities }: TimelineDayProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formattedDate = format(new Date(dayDate), 'EEE, MMM d');

  return (
    <div className="mb-6">
      {/* Day Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-game-card rounded-lg mb-3 hover:bg-opacity-80 transition-all"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-game-accent-green" />
          <div className="text-left">
            <h3 className="text-white font-bold text-lg">Day {dayNumber}</h3>
            <p className="text-gray-400 text-sm">{formattedDate}</p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Activities */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 overflow-hidden"
          >
            {activities.map((activity) => (
              <TimelineActivity key={activity.activity_id} item={activity} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
