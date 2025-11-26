import React, { useState } from 'react';
import { TemplateDayActivityCreate, ActivityDetail } from '../../../types';
import { ChevronUp, ChevronDown, X, GripVertical, Clock, MapPin } from 'lucide-react';
import Input from '../../../components/ui/Input';

interface DayActivityListProps {
  activities: TemplateDayActivityCreate[];
  activityDetails: ActivityDetail[];
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onUpdateActivity: (index: number, updates: Partial<TemplateDayActivityCreate>) => void;
}

const DayActivityList: React.FC<DayActivityListProps> = ({
  activities,
  activityDetails,
  onRemove,
  onMoveUp,
  onMoveDown,
  onReorder,
  onUpdateActivity,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted border-2 border-dashed border-border rounded-lg">
        <p className="text-sm">No activities added yet.</p>
        <p className="text-xs mt-1">Click "Add Activity" to start building this day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((act, index) => {
        const activity = activityDetails.find((a) => a.id === act.activity_id);
        if (!activity) return null;

        const isExpanded = expandedIndex === index;

        return (
          <div
            key={`${act.activity_id}-${index}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-white border rounded-lg transition-all ${
              draggedIndex === index
                ? 'opacity-50 border-primary-400'
                : 'border-border hover:border-primary-300'
            }`}
          >
            {/* Activity Header */}
            <div className="flex items-center gap-3 p-3">
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing text-muted hover:text-primary">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Order Indicator */}
              <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold">
                {index + 1}
              </div>

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-primary truncate">{activity.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                  {activity.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                  )}
                  {act.time_slot && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{act.time_slot}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="p-1 text-muted hover:text-primary transition-colors"
                  title="Edit details"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => onMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onMoveDown(index)}
                  disabled={index === activities.length - 1}
                  className="p-1 text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onRemove(index)}
                  className="p-1 text-error hover:text-red-600 transition-colors"
                  title="Remove activity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-border px-3 pb-3 pt-3 bg-gray-50 space-y-3">
                <Input
                  label="Time Slot"
                  placeholder="e.g., 9:00 AM - 12:00 PM"
                  value={act.time_slot || ''}
                  onChange={(e) => onUpdateActivity(index, { time_slot: e.target.value || null })}
                />

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Custom Notes
                  </label>
                  <textarea
                    value={act.custom_notes || ''}
                    onChange={(e) =>
                      onUpdateActivity(index, { custom_notes: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm"
                    rows={2}
                    placeholder="Add custom notes for this activity..."
                  />
                </div>

                {activity.short_description && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted font-medium mb-1">Activity Description:</p>
                    <p className="text-xs text-secondary">{activity.short_description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DayActivityList;
