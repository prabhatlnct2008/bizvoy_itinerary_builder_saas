import React, { useState } from 'react';
import { TemplateDayActivityCreate, ActivityDetail, ItemType } from '../../../types';
import {
  ChevronUp,
  ChevronDown,
  X,
  GripVertical,
  Clock,
  MapPin,
  Hotel,
  Car,
  Plane,
  FileText,
  Coffee,
  Utensils,
  Ship,
  Train,
  Bus,
  Briefcase
} from 'lucide-react';
import Input from '../../../components/ui/Input';

// Icon mapping for logistics items
const LOGISTICS_ICONS: Record<string, React.ElementType> = {
  hotel: Hotel,
  taxi: Car,
  car: Car,
  plane: Plane,
  flight: Plane,
  note: FileText,
  coffee: Coffee,
  meal: Utensils,
  dining: Utensils,
  ship: Ship,
  cruise: Ship,
  train: Train,
  bus: Bus,
  transfer: Bus,
  business: Briefcase,
};

const getLogisticsIcon = (iconHint?: string | null): React.ElementType => {
  if (!iconHint) return FileText;
  const key = iconHint.toLowerCase();
  return LOGISTICS_ICONS[key] || FileText;
};

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
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex) {
      onReorder(draggedIndex, dropTargetIndex);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
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
        const itemType: ItemType = (act.item_type as ItemType) || 'LIBRARY_ACTIVITY';
        const isAdHocItem = itemType === 'LOGISTICS' || itemType === 'NOTE';

        // For library activities, find the activity details
        const activity = !isAdHocItem ? activityDetails.find((a) => a.id === act.activity_id) : null;

        // Skip if it's a library activity but we can't find the details
        if (!isAdHocItem && !activity) return null;

        const isExpanded = expandedIndex === index;
        const IconComponent = isAdHocItem ? getLogisticsIcon(act.custom_icon) : null;

        return (
          <div
            key={`${act.activity_id || act.custom_title}-${index}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-white border rounded-lg transition-all ${
              draggedIndex === index
                ? 'opacity-50 border-primary-400'
                : dropTargetIndex === index
                ? 'border-primary-500 border-2'
                : 'border-border hover:border-primary-300'
            }`}
          >
            {/* Activity Header */}
            <div className="flex items-center gap-3 p-3">
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing text-muted hover:text-primary p-1">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Order Indicator / Icon */}
              {isAdHocItem ? (
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  itemType === 'LOGISTICS'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                </div>
              ) : (
                <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold">
                  {index + 1}
                </div>
              )}

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-primary truncate">
                    {isAdHocItem ? act.custom_title : activity?.name}
                  </h4>
                  {isAdHocItem && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      itemType === 'LOGISTICS'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {itemType === 'LOGISTICS' ? 'Logistics' : 'Note'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                  {!isAdHocItem && activity?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                  )}
                  {(act.time_slot || act.start_time) && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {act.start_time && act.end_time
                          ? `${act.start_time} - ${act.end_time}`
                          : act.time_slot || act.start_time}
                      </span>
                    </div>
                  )}
                  {isAdHocItem && act.custom_notes && (
                    <span className="truncate max-w-[200px]">{act.custom_notes}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="p-2 text-muted hover:text-primary hover:bg-gray-100 rounded transition-colors"
                  title="Edit details"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                  className="p-2 text-muted hover:text-primary hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>

                <button
                  onClick={() => onMoveDown(index)}
                  disabled={index === activities.length - 1}
                  className="p-2 text-muted hover:text-primary hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>

                <button
                  onClick={() => onRemove(index)}
                  className="p-2 text-error hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove activity"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-border px-3 pb-3 pt-3 bg-gray-50 space-y-3">
                {isAdHocItem && (
                  <Input
                    label="Title"
                    placeholder="e.g., Hotel Check-in, Airport Transfer"
                    value={act.custom_title || ''}
                    onChange={(e) => onUpdateActivity(index, { custom_title: e.target.value || null })}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Time"
                    type="time"
                    value={act.start_time || ''}
                    onChange={(e) => onUpdateActivity(index, { start_time: e.target.value || null })}
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={act.end_time || ''}
                    onChange={(e) => onUpdateActivity(index, { end_time: e.target.value || null })}
                  />
                </div>

                {!isAdHocItem && (
                  <Input
                    label="Time Slot (text)"
                    placeholder="e.g., Morning, Afternoon"
                    value={act.time_slot || ''}
                    onChange={(e) => onUpdateActivity(index, { time_slot: e.target.value || null })}
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    {isAdHocItem ? 'Details' : 'Custom Notes'}
                  </label>
                  <textarea
                    value={act.custom_notes || ''}
                    onChange={(e) =>
                      onUpdateActivity(index, { custom_notes: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm"
                    rows={2}
                    placeholder={isAdHocItem
                      ? "Add details about this item..."
                      : "Add custom notes for this activity..."}
                  />
                </div>

                {isAdHocItem && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Icon
                    </label>
                    <select
                      value={act.custom_icon || ''}
                      onChange={(e) => onUpdateActivity(index, { custom_icon: e.target.value || null })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm"
                    >
                      <option value="">Default</option>
                      <option value="hotel">Hotel</option>
                      <option value="taxi">Taxi / Car</option>
                      <option value="plane">Flight</option>
                      <option value="train">Train</option>
                      <option value="bus">Bus / Transfer</option>
                      <option value="ship">Ship / Cruise</option>
                      <option value="meal">Meal / Dining</option>
                      <option value="coffee">Coffee / Break</option>
                      <option value="note">Note</option>
                    </select>
                  </div>
                )}

                {!isAdHocItem && activity?.short_description && (
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
