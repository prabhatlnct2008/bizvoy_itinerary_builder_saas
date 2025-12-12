import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { PublicItineraryDay } from '../../types';
import ActivityCard from './ActivityCard';

interface DayCardProps {
  day: PublicItineraryDay;
  isExpanded: boolean;
  onToggle: () => void;
  expandedActivities: Set<string>;
  toggleActivity: (id: string) => void;
  baseUrl: string;
  formatDuration: (value: number | null, unit: string | null) => string | null;
  formatDateFull: (dateStr: string) => string;
  showPersonalizationLink?: boolean;
  personalizationToken?: string;
}

const DayCard: React.FC<DayCardProps> = ({
  day,
  isExpanded,
  onToggle,
  expandedActivities,
  toggleActivity,
  baseUrl,
  formatDuration,
  formatDateFull,
  showPersonalizationLink = false,
  personalizationToken,
}) => {
  const navigate = useNavigate();

  // Get preview images for avatar stack
  const previewImages = day.activities
    .flatMap((a) => a.images || [])
    .filter((img) => img.url)
    .slice(0, 3);

  const extraCount = Math.max(0, day.activities.flatMap((a) => a.images || []).length - 3);

  return (
    <div>
      {/* Day Header - Dark */}
      <div
        onClick={onToggle}
        className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:from-slate-750 hover:to-slate-850 transition-colors"
      >
        {/* Day Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-400 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-800 uppercase">Day</span>
          <span className="text-2xl font-bold text-slate-800">{day.day_number}</span>
        </div>

        {/* Day Info */}
        <div className="flex-1 min-w-0">
          <p className="text-amber-400 text-sm font-medium">{formatDateFull(day.actual_date)}</p>
          <h3 className="text-white text-lg font-semibold truncate">
            {day.title || `Day ${day.day_number}`}
          </h3>
          <p className="text-slate-400 text-sm">
            {day.activities.length} activit{day.activities.length === 1 ? 'y' : 'ies'} planned
          </p>
        </div>

        {/* Avatar Stack */}
        {previewImages.length > 0 && (
          <div className="hidden md:flex items-center">
            {previewImages.map((img, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-full border-2 border-slate-800 overflow-hidden ${
                  idx > 0 ? '-ml-3' : ''
                }`}
              >
                <img src={`${baseUrl}${img.url}`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center -ml-3">
                <span className="text-xs text-white font-medium">+{extraCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Chevron */}
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6">
          {/* Day Notes */}
          {day.notes && (
            <div className="bg-white rounded-xl p-5 mb-6 border-l-4 border-slate-300">
              <p className="text-slate-600 text-sm leading-relaxed">{day.notes}</p>
            </div>
          )}

          {/* Activities Timeline */}
          {day.activities.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-slate-400">No activities scheduled for this day</p>
            </div>
          ) : (
            <div className="relative space-y-2">
              {day.activities.map((activity, idx) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isExpanded={expandedActivities.has(activity.id)}
                  onToggle={() => toggleActivity(activity.id)}
                  baseUrl={baseUrl}
                  formatDuration={formatDuration}
                  isLast={idx === day.activities.length - 1}
                />
              ))}
            </div>
          )}

          {/* Optional inline personalization entry */}
          {showPersonalizationLink && personalizationToken && (
            <button
              onClick={() => navigate(`/itinerary/${personalizationToken}/personalize`)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-colors group"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-emerald-700">Add experiences you'll love</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DayCard;
