import React, { useState } from 'react';
import { TemplateDayCreate } from '../../../types';
import {
  GripVertical,
  Plus,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface DayTimelineProps {
  days: TemplateDayCreate[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  onAddDay: () => void;
  onDeleteDay: (index: number) => void;
  onDuplicateDay: (index: number) => void;
  onReorderDays: (startIndex: number, endIndex: number) => void;
  onRenameDay: (index: number, newTitle: string) => void;
}

const DayTimeline: React.FC<DayTimelineProps> = ({
  days,
  selectedDayIndex,
  onSelectDay,
  onAddDay,
  onDeleteDay,
  onDuplicateDay,
  onReorderDays,
  onRenameDay,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setDropTargetIndex(null);
    // Set drag image opacity
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Only track the drop target visually - don't reorder yet
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    // Perform the reorder only when drag ends
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex) {
      onReorderDays(draggedIndex, dropTargetIndex);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleMoveUp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      onReorderDays(index, index - 1);
    }
  };

  const handleMoveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < days.length - 1) {
      onReorderDays(index, index + 1);
    }
  };

  const handleDelete = (index: number) => {
    const day = days[index];
    const activityCount = day.activities.length;
    const message = activityCount > 0
      ? `Delete Day ${index + 1} – "${day.title || 'Untitled'}"?\n\nThis will remove ${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}.`
      : `Delete Day ${index + 1} – "${day.title || 'Untitled'}"?`;

    if (window.confirm(message)) {
      onDeleteDay(index);
    }
    setOpenMenuIndex(null);
  };

  const handleDuplicate = (index: number) => {
    onDuplicateDay(index);
    setOpenMenuIndex(null);
  };

  const startRename = (index: number) => {
    setEditingIndex(index);
    setEditingTitle(days[index].title || '');
    setOpenMenuIndex(null);
  };

  const finishRename = () => {
    if (editingIndex !== null) {
      onRenameDay(editingIndex, editingTitle);
      setEditingIndex(null);
      setEditingTitle('');
    }
  };

  const cancelRename = () => {
    setEditingIndex(null);
    setEditingTitle('');
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-primary mb-3">Day Timeline</h3>

      <div className="space-y-1">
        {days.map((day, index) => (
          <div
            key={`day-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            className={`relative group transition-all ${
              draggedIndex === index ? 'opacity-50 scale-95' : ''
            } ${
              dropTargetIndex === index ? 'ring-2 ring-primary-400 ring-offset-2' : ''
            }`}
          >
            <div
              onClick={() => onSelectDay(index)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-all cursor-pointer ${
                selectedDayIndex === index
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white border border-border hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Drag Handle */}
                <div
                  className={`cursor-grab active:cursor-grabbing ${
                    selectedDayIndex === index ? 'text-primary-200' : 'text-gray-400'
                  }`}
                >
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Day Badge */}
                <div
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    selectedDayIndex === index
                      ? 'bg-primary-700 text-white'
                      : 'bg-primary-100 text-primary-700'
                  }`}
                >
                  DAY {index + 1}
                </div>

                {/* Day Info */}
                <div className="flex-1 min-w-0">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={finishRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full px-1 py-0.5 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-900"
                      placeholder="Day title..."
                    />
                  ) : (
                    <>
                      <div
                        className={`font-medium text-sm truncate ${
                          selectedDayIndex === index ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {day.title || 'Untitled Day'}
                      </div>
                      <div
                        className={`text-xs ${
                          selectedDayIndex === index ? 'text-primary-200' : 'text-gray-500'
                        }`}
                      >
                        {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons (shown on hover) */}
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => handleMoveUp(index, e)}
                    disabled={index === 0}
                    className={`p-1.5 rounded transition-colors ${
                      selectedDayIndex === index
                        ? 'text-primary-200 hover:text-white hover:bg-primary-500 disabled:text-primary-400'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:text-gray-300'
                    } disabled:cursor-not-allowed`}
                    title="Move up"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => handleMoveDown(index, e)}
                    disabled={index === days.length - 1}
                    className={`p-1.5 rounded transition-colors ${
                      selectedDayIndex === index
                        ? 'text-primary-200 hover:text-white hover:bg-primary-500 disabled:text-primary-400'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:text-gray-300'
                    } disabled:cursor-not-allowed`}
                    title="Move down"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(index);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      selectedDayIndex === index
                        ? 'text-red-300 hover:text-white hover:bg-red-500'
                        : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title="Delete day"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Actions Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex(openMenuIndex === index ? null : index);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      selectedDayIndex === index
                        ? 'text-primary-200 hover:text-white hover:bg-primary-500'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuIndex === index && (
                    <div
                      className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => startRename(index)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Rename
                      </button>
                      <button
                        onClick={() => handleDuplicate(index)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => handleDelete(index)}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Day Button */}
      <button
        onClick={onAddDay}
        className="w-full mt-3 py-2.5 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Day
      </button>

      {/* Summary */}
      <div className="pt-3 border-t border-border">
        <div className="text-xs text-muted">
          Total: {days.length} {days.length === 1 ? 'day' : 'days'} / {Math.max(days.length - 1, 0)} nights
        </div>
      </div>

      {/* Click outside to close menu */}
      {openMenuIndex !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenuIndex(null)}
        />
      )}
    </div>
  );
};

export default DayTimeline;
