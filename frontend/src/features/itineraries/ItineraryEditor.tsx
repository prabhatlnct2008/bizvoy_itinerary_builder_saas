import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Chip from '../../components/ui/Chip';
import ShareModal from './ShareModal';
import LogisticsItemForm from './components/LogisticsItemForm';
import itinerariesApi from '../../api/itineraries';
import activitiesApi from '../../api/activities';
import { useItineraryStore } from '../../store/itineraryStore';
import {
  ItineraryUpdate,
  ActivityDetail,
  ItineraryDayActivityCreate,
} from '../../types';

const ItineraryEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentItinerary,
    days,
    hasUnsavedChanges,
    setItinerary,
    updateDay,
    reorderDays,
    addActivityToDay,
    removeActivityFromDay,
    moveActivity,
    updateActivity,
    markSaved,
  } = useItineraryStore();

  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isLogisticsModalOpen, setIsLogisticsModalOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Metadata editing
  const [status, setStatus] = useState<string>('draft');

  // Drag-drop state for day reordering
  const [draggedDayIndex, setDraggedDayIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchItinerary();
    }
    fetchActivities();
  }, [id]);

  const fetchItinerary = async () => {
    try {
      setIsLoading(true);
      const data = await itinerariesApi.getItinerary(id!);
      setItinerary(data);
      setStatus(data.status);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load itinerary');
      navigate('/itineraries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await activitiesApi.getActivities();
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleSave = async () => {
    if (!currentItinerary) return;

    setIsSaving(true);

    try {
      const updateData: ItineraryUpdate = {
        status: status as any,
        days,
      };

      await itinerariesApi.updateItinerary(currentItinerary.id, updateData);
      toast.success('Itinerary saved successfully');
      markSaved();
      // Refresh to get updated data
      await fetchItinerary();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save itinerary');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddActivity = (activity: ActivityDetail) => {
    addActivityToDay(currentDayIndex, {
      activity_id: activity.id,
      item_type: 'LIBRARY_ACTIVITY',
      display_order: days[currentDayIndex].activities.length,
      time_slot: null,
      custom_notes: null,
      custom_price: activity.base_price || null,
      start_time: null,
      end_time: null,
    });
    setIsActivityModalOpen(false);
    toast.success('Activity added');
  };

  const handleAddLogisticsItem = (item: ItineraryDayActivityCreate) => {
    addActivityToDay(currentDayIndex, item);
    toast.success(`${item.item_type === 'LOGISTICS' ? 'Logistics item' : 'Note'} added`);
  };

  // Drag-drop handlers for day reordering
  const handleDayDragStart = (e: React.DragEvent, index: number) => {
    setDraggedDayIndex(index);
    setDropTargetIndex(null);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDayDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Only track the drop target visually - don't reorder yet
    if (draggedDayIndex !== null && draggedDayIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDayDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDayDragEnd = () => {
    // Perform the reorder only when drag ends (on DROP)
    if (draggedDayIndex !== null && dropTargetIndex !== null && draggedDayIndex !== dropTargetIndex) {
      reorderDays(draggedDayIndex, dropTargetIndex);
      // Update current day index to follow the moved day if it was selected
      if (currentDayIndex === draggedDayIndex) {
        setCurrentDayIndex(dropTargetIndex);
      } else if (draggedDayIndex < currentDayIndex && dropTargetIndex >= currentDayIndex) {
        setCurrentDayIndex(currentDayIndex - 1);
      } else if (draggedDayIndex > currentDayIndex && dropTargetIndex <= currentDayIndex) {
        setCurrentDayIndex(currentDayIndex + 1);
      }
      toast.success('Day order updated');
    }
    setDraggedDayIndex(null);
    setDropTargetIndex(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentItinerary || days.length === 0) {
    return (
      <div className="p-6 text-center text-muted">
        <p>Itinerary not found</p>
        <Button className="mt-4" onClick={() => navigate('/itineraries')}>
          Back to Itineraries
        </Button>
      </div>
    );
  }

  const currentDay = days[currentDayIndex];
  const filteredActivities = activities.filter((act) =>
    act.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'primary';
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-primary">
                {currentItinerary.trip_name}
              </h1>
              <Chip
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                variant={getStatusColor(status)}
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-secondary">
              <span>Client: {currentItinerary.client_name}</span>
              <span>•</span>
              <span>{currentItinerary.destination}</span>
              <span>•</span>
              <span>
                {new Date(currentItinerary.start_date).toLocaleDateString()} -{' '}
                {new Date(currentItinerary.end_date).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>
                {currentItinerary.num_adults} Adult{currentItinerary.num_adults > 1 ? 's' : ''}
                {currentItinerary.num_children > 0 && `, ${currentItinerary.num_children} Child${currentItinerary.num_children > 1 ? 'ren' : ''}`}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <Button variant="secondary" onClick={() => navigate('/itineraries')}>
              Close
            </Button>
            <Button variant="secondary" onClick={() => setIsShareModalOpen(true)}>
              Share & Export
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              {hasUnsavedChanges ? 'Save Changes *' : 'Saved ✓'}
            </Button>
          </div>
        </div>
      </div>

      {/* Day-wise Editor */}
      <div className="bg-white rounded-lg shadow">
        {/* Day Tabs - Draggable for reordering */}
        <div className="border-b border-border overflow-x-auto">
          <div className="flex">
            {days.map((day, index) => {
              const date = new Date(day.actual_date);
              return (
                <button
                  key={day.day_number}
                  draggable
                  onDragStart={(e) => handleDayDragStart(e, index)}
                  onDragOver={(e) => handleDayDragOver(e, index)}
                  onDragLeave={handleDayDragLeave}
                  onDragEnd={handleDayDragEnd}
                  onClick={() => setCurrentDayIndex(index)}
                  className={`px-6 py-4 font-medium whitespace-nowrap transition-all cursor-move ${
                    draggedDayIndex === index ? 'opacity-50 scale-95' : ''
                  } ${
                    dropTargetIndex === index ? 'ring-2 ring-primary-400 ring-offset-1' : ''
                  } ${
                    currentDayIndex === index
                      ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50'
                      : 'text-secondary hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-sm">Day {day.day_number}</div>
                    <div className="text-xs text-muted">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  <span className="ml-2 text-xs text-muted">({day.activities.length})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Content */}
        <div className="p-6">
          {/* Day Title & Notes */}
          <div className="mb-6 space-y-3">
            <Input
              label="Day Title"
              value={currentDay.title || ''}
              onChange={(e) => updateDay(currentDayIndex, { title: e.target.value })}
              placeholder={`Day ${currentDay.day_number} - ${new Date(currentDay.actual_date).toLocaleDateString()}`}
            />

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Day Notes</label>
              <textarea
                value={currentDay.notes || ''}
                onChange={(e) => updateDay(currentDayIndex, { notes: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                rows={2}
                placeholder="Optional notes for this day..."
              />
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-primary">Activities</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsLogisticsModalOpen(true)}>
                  + Add Logistics/Note
                </Button>
                <Button size="sm" onClick={() => setIsActivityModalOpen(true)}>
                  + Add Activity
                </Button>
              </div>
            </div>

            {currentDay.activities.length === 0 ? (
              <div className="text-center py-8 text-muted border border-dashed border-border rounded-lg">
                No activities added yet. Click "Add Activity" to start.
              </div>
            ) : (
              <div className="space-y-3">
                {currentDay.activities.map((act, actIndex) => {
                  // Handle different item types
                  const isLibraryActivity = act.item_type === 'LIBRARY_ACTIVITY';
                  const isLogistics = act.item_type === 'LOGISTICS';
                  const isNote = act.item_type === 'NOTE';

                  const activity = isLibraryActivity ? activities.find((a) => a.id === act.activity_id) : null;

                  // Skip if it's a library activity but we can't find the activity details
                  if (isLibraryActivity && !activity) return null;

                  // Determine background color based on item type
                  const bgColor = isLogistics
                    ? 'bg-amber-50 border-amber-200'
                    : isNote
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-border';

                  return (
                    <div
                      key={actIndex}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor}`}
                    >
                      {/* Move Buttons */}
                      <div className="flex flex-col gap-1 mt-1">
                        <button
                          onClick={() => moveActivity(currentDayIndex, actIndex, 'up')}
                          disabled={actIndex === 0}
                          className="text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveActivity(currentDayIndex, actIndex, 'down')}
                          disabled={actIndex === currentDay.activities.length - 1}
                          className="text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          {/* Icon for logistics/notes */}
                          {(isLogistics || isNote) && act.custom_icon && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isLogistics ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              <span className="text-sm">{
                                act.custom_icon === 'hotel' ? '🏨' :
                                act.custom_icon === 'taxi' ? '🚕' :
                                act.custom_icon === 'plane' ? '✈️' :
                                act.custom_icon === 'train' ? '🚂' :
                                act.custom_icon === 'bus' ? '🚌' :
                                act.custom_icon === 'ship' ? '🚢' :
                                act.custom_icon === 'meal' ? '🍽️' :
                                act.custom_icon === 'coffee' ? '☕' :
                                act.custom_icon === 'note' ? '📝' :
                                '📌'
                              }</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-primary">
                                {isLibraryActivity ? activity?.name : act.custom_title}
                              </p>
                              {isLogistics && (
                                <span className="px-2 py-0.5 text-xs bg-amber-200 text-amber-800 rounded">
                                  Logistics
                                </span>
                              )}
                              {isNote && (
                                <span className="px-2 py-0.5 text-xs bg-blue-200 text-blue-800 rounded">
                                  Note
                                </span>
                              )}
                            </div>
                            {isLibraryActivity && activity?.location && (
                              <p className="text-sm text-muted">{activity.location}</p>
                            )}
                          </div>
                        </div>

                        {/* Time Fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="time"
                            placeholder="Start time"
                            value={act.start_time || ''}
                            onChange={(e) =>
                              updateActivity(currentDayIndex, actIndex, { start_time: e.target.value || null })
                            }
                            className="text-sm"
                          />
                          <Input
                            type="time"
                            placeholder="End time"
                            value={act.end_time || ''}
                            onChange={(e) =>
                              updateActivity(currentDayIndex, actIndex, { end_time: e.target.value || null })
                            }
                            className="text-sm"
                          />
                        </div>

                        {/* Custom Notes */}
                        <textarea
                          value={act.custom_notes || ''}
                          onChange={(e) =>
                            updateActivity(currentDayIndex, actIndex, { custom_notes: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                          rows={2}
                          placeholder={`${isLogistics ? 'Logistics' : isNote ? 'Note' : 'Activity'} details...`}
                        />

                        {/* Custom Price (only for library activities) */}
                        {isLibraryActivity && (
                          <Input
                            type="number"
                            placeholder="Custom price"
                            value={act.custom_price || ''}
                            onChange={(e) =>
                              updateActivity(currentDayIndex, actIndex, {
                                custom_price: parseFloat(e.target.value) || null,
                              })
                            }
                            className="text-sm w-40"
                          />
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeActivityFromDay(currentDayIndex, actIndex)}
                        className="text-error hover:text-red-600 mt-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Selection Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Add Activity"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredActivities.length === 0 ? (
              <p className="text-center py-8 text-muted">No activities found</p>
            ) : (
              filteredActivities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => handleAddActivity(activity)}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-border transition-colors"
                >
                  <p className="font-medium text-primary">{activity.name}</p>
                  <p className="text-sm text-muted">{activity.location}</p>
                  {activity.base_price && (
                    <p className="text-sm text-secondary-500 mt-1">${activity.base_price}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        itineraryId={currentItinerary.id}
      />

      {/* Logistics/Notes Modal */}
      <Modal
        isOpen={isLogisticsModalOpen}
        onClose={() => setIsLogisticsModalOpen(false)}
        title="Add Logistics or Note"
        size="lg"
      >
        <LogisticsItemForm
          onAddItem={handleAddLogisticsItem}
          displayOrder={currentDay.activities.length}
        />
      </Modal>
    </div>
  );
};

export default ItineraryEditor;
