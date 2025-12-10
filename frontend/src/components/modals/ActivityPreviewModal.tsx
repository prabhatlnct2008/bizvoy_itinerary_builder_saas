import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ActivityDetail } from '../../types';
import activitiesApi from '../../api/activities';
import {
  Clock,
  MapPin,
  Star,
  Users,
  DollarSign,
  Tag,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
} from 'lucide-react';

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
}

const ActivityPreviewModal: React.FC<ActivityPreviewModalProps> = ({
  isOpen,
  onClose,
  activityId,
  activity: providedActivity,
  onAddToDay,
  availableDays,
  hideAddButton = false,
}) => {
  const [activity, setActivity] = useState<ActivityDetail | null>(providedActivity || null);
  const [isLoading, setIsLoading] = useState(!providedActivity && !!activityId);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(availableDays?.[0]?.index ?? 0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  // Fetch activity if only ID provided
  useEffect(() => {
    if (providedActivity) {
      setActivity(providedActivity);
      setIsLoading(false);
      return;
    }

    if (activityId && isOpen) {
      fetchActivity();
    }
  }, [activityId, providedActivity, isOpen]);

  // Reset image index when activity changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activity?.id]);

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

  const formatDuration = (value: number | null | undefined, unit: string | null | undefined) => {
    if (!value) return null;
    if (unit === 'minutes') return `${value} mins`;
    if (unit === 'hours') return value === 1 ? '1 hour' : `${value} hours`;
    return `${value} ${unit || ''}`;
  };

  const getImageUrl = (img: { file_path?: string; file_url?: string }) => {
    if (img.file_url) return img.file_url.startsWith('http') ? img.file_url : `${baseUrl}${img.file_url}`;
    if (img.file_path) return `${baseUrl}/uploads/${img.file_path}`;
    return '';
  };

  const handlePrevImage = () => {
    if (!activity?.images?.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? activity.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!activity?.images?.length) return;
    setCurrentImageIndex((prev) => (prev === activity.images.length - 1 ? 0 : prev + 1));
  };

  const handleAdd = () => {
    if (activity && onAddToDay) {
      onAddToDay(activity, selectedDayIndex);
      onClose();
    }
  };

  const parseHighlights = (highlights: string | null | undefined): string[] => {
    if (!highlights) return [];
    try {
      const parsed = JSON.parse(highlights);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return highlights.split(',').map((h) => h.trim()).filter(Boolean);
    }
  };

  const parseTags = (tags: string | null | undefined): string[] => {
    if (!tags) return [];
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return tags.split(',').map((t) => t.trim()).filter(Boolean);
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

    const images = activity.images || [];
    const currentImage = images[currentImageIndex];
    const highlights = parseHighlights(activity.highlights);
    const tags = parseTags(activity.tags);
    const duration = formatDuration(activity.default_duration_value, activity.default_duration_unit);

    return (
      <div className="space-y-6">
        {/* Image Carousel */}
        {images.length > 0 && (
          <div className="relative">
            <div className="aspect-video rounded-xl overflow-hidden bg-slate-100">
              <img
                src={getImageUrl(currentImage)}
                alt={activity.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category & Name */}
        <div>
          {activity.category_label && (
            <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full mb-2">
              {activity.category_label}
            </span>
          )}
          <h2 className="text-2xl font-bold text-slate-900">{activity.name}</h2>
        </div>

        {/* Meta Info Row */}
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          {duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{duration}</span>
            </div>
          )}
          {activity.location_display && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{activity.location_display}</span>
            </div>
          )}
          {activity.rating && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{activity.rating}</span>
            </div>
          )}
          {activity.group_size_label && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{activity.group_size_label}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {(activity.client_description || activity.short_description) && (
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              {activity.client_description || activity.short_description}
            </p>
          </div>
        )}

        {/* Stats Row */}
        <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-4">
          {/* Rating */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className={`w-4 h-4 ${activity.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
              <span className={`font-semibold ${activity.rating ? 'text-amber-500' : 'text-slate-400'}`}>
                {activity.rating || '-'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Rating</p>
          </div>

          {/* Group Size */}
          <div className="text-center border-x border-slate-200">
            <div className="flex items-center justify-center gap-1">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700">
                {activity.group_size_label || 'Private'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Group Size</p>
          </div>

          {/* Cost */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <DollarSign className={`w-4 h-4 ${activity.cost_type === 'included' ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span className={`font-semibold ${activity.cost_type === 'included' ? 'text-emerald-500' : 'text-slate-700'}`}>
                {activity.cost_type === 'included' ? 'Included' : activity.cost_display || 'Extra'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Cost</p>
          </div>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Highlights</h3>
            <div className="flex flex-wrap gap-2">
              {highlights.map((highlight, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm rounded-lg"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

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
