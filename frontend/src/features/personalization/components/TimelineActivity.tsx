import { Lock, Sparkles, Clock } from 'lucide-react';
import { FittedItem } from '../../../types/personalization';

interface TimelineActivityProps {
  item: FittedItem;
}

export const TimelineActivity = ({ item }: TimelineActivityProps) => {
  const isLocked = item.is_locked;

  return (
    <div
      className={`
        p-4 rounded-lg flex items-start gap-4
        ${isLocked ? 'bg-gray-700 border-2 border-gray-600' : 'bg-game-accent-green bg-opacity-10 border-2 border-game-accent-green'}
      `}
    >
      {/* Image */}
      <div className="flex-shrink-0">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-20 h-20 rounded-lg object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-white font-semibold text-base leading-tight">
            {item.name}
          </h4>

          {/* Icon */}
          <div className="flex-shrink-0">
            {isLocked ? (
              <Lock className="w-5 h-5 text-gray-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-game-accent-green" />
            )}
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
          <Clock className="w-4 h-4" />
          <span>
            {item.start_time} - {item.end_time} ({item.duration_display})
          </span>
        </div>

        {/* Fit reason */}
        <div className="text-xs text-gray-400 mb-2">
          {item.fit_reason}
        </div>

        {/* Price */}
        {!isLocked && (
          <div className="text-game-accent-green font-semibold text-sm">
            +{item.currency_code} {item.price_numeric.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};
