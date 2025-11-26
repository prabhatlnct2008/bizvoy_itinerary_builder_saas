import React from 'react';
import { TemplateDayCreate } from '../../../types';

interface DayTimelineProps {
  days: TemplateDayCreate[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
}

const DayTimeline: React.FC<DayTimelineProps> = ({ days, selectedDayIndex, onSelectDay }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-primary mb-3">Day Timeline</h3>

      <div className="space-y-1">
        {days.map((day, index) => (
          <button
            key={day.day_number}
            onClick={() => onSelectDay(index)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              selectedDayIndex === index
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white border border-border hover:border-primary-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  Day {day.day_number}
                </div>
                {day.title && (
                  <div
                    className={`text-xs mt-1 line-clamp-1 ${
                      selectedDayIndex === index ? 'text-primary-100' : 'text-muted'
                    }`}
                  >
                    {day.title}
                  </div>
                )}
              </div>
              <div
                className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  selectedDayIndex === index
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-100 text-muted'
                }`}
              >
                {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-3 border-t border-border">
        <div className="text-xs text-muted">
          Total: {days.length} {days.length === 1 ? 'day' : 'days'}
        </div>
      </div>
    </div>
  );
};

export default DayTimeline;
