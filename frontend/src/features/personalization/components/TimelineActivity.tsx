import { Lock, Sparkles, Clock } from 'lucide-react';
import { FittedItem } from '../../../types/personalization';

interface TimelineActivityProps {
  item: FittedItem;
}

export const TimelineActivity = ({ item }: TimelineActivityProps) => {
  // Backend payload is minimal; normalize for safe rendering
  const isLocked = (item as any).is_locked || false;
  const name = (item as any).name || item.activity_name || 'Activity';
  const imageUrl = (item as any).image_url;
  const start = (item as any).start_time;
  const end = (item as any).end_time;
  const timeSlot = item.time_slot || start || end ? `${start || ''}${start && end ? ' - ' : ''}${end || ''}` : 'Time TBD';
  const fitReason = item.fit_reason || 'Added to your itinerary';
  const price = (item as any).price_numeric ?? item.quoted_price;
  const currency = item.currency_code || '';

  return (
    <div
      className={`
        p-4 rounded-lg flex items-start gap-4
        ${isLocked ? 'bg-gray-700 border-2 border-gray-600' : 'bg-game-accent-green bg-opacity-10 border-2 border-game-accent-green'}
      `}
    >
      {/* Image */}
      <div className="flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-20 h-20 rounded-lg object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-white font-semibold text-base leading-tight">
            {name}
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
          <span>{timeSlot}</span>
        </div>

        {/* Fit reason */}
        <div className="text-xs text-gray-400 mb-2">
          {fitReason}
        </div>

        {/* Price */}
        {!isLocked && price != null && (
          <div className="text-game-accent-green font-semibold text-sm">
            +{currency} {Number(price).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};
