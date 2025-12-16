import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ActivityDetailView } from '../activity';
import { ActivityDetail } from '../../types';
import activitiesApi from '../../api/activities';
import { Plus, Loader2 } from 'lucide-react';

interface ActivityPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Activity ID to fetch, or full activity data */
  activityId?: string;
  activity?: ActivityDetail;
  /** Called when user clicks "Add to Day" */
  onAddToDay?: (activity: ActivityDetail, dayIndex: number) => void;
  /** Available days for adding */
  availableDays?: { index: number; label: string }[];
  /** Hide the add button */
  hideAddButton?: boolean;
  /** Default day index to preselect in the add dropdown */
  defaultDayIndex?: number;
}

const ActivityPreviewModal: React.FC<ActivityPreviewModalProps> = ({
  isOpen,
  onClose,
  activityId,
  activity: providedActivity,
  onAddToDay,
  availableDays,
  hideAddButton = false,
  defaultDayIndex,
}) => {
  const [activity, setActivity] = useState<ActivityDetail | null>(providedActivity || null);
  const [isLoading, setIsLoading] = useState(!providedActivity && !!activityId);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(defaultDayIndex ?? availableDays?.[0]?.index ?? 0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  // Fetch activity when an ID is provided to ensure full details (images, meta)
  useEffect(() => {
    const shouldFetch = !!activityId && isOpen;

    if (shouldFetch) {
      fetchActivity();
    } else if (providedActivity) {
      setActivity(providedActivity);
      setIsLoading(false);
    }
  }, [activityId, providedActivity, isOpen]);

  // Keep selected day in sync when modal opens or default changes
  useEffect(() => {
    if (isOpen) {
      const next = defaultDayIndex ?? availableDays?.[0]?.index ?? 0;
      setSelectedDayIndex(next);
    }
  }, [isOpen, defaultDayIndex, availableDays]);

  const fetchActivity = async () => {
    if (!activityId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await activitiesApi.getActivity(activityId);
      setActivity(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    if (activity && onAddToDay) {
      onAddToDay(activity, selectedDayIndex);
      onClose();
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    if (!activity) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">No activity selected</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Shared Activity Detail View */}
        <ActivityDetailView
          activity={activity}
          baseUrl={baseUrl}
          variant="full"
          showImages={true}
        />

        {/* Add to Day Section */}
        {!hideAddButton && onAddToDay && availableDays && availableDays.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Add to Day
                </label>
                <select
                  value={selectedDayIndex}
                  onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {availableDays.map((day) => (
                    <option key={day.index} value={day.index}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAdd} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Activity
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activity?.name || 'Activity Preview'}
      size="xl"
      maxContentHeight="70vh"
    >
      {renderContent()}
    </Modal>
  );
};

export default ActivityPreviewModal;
