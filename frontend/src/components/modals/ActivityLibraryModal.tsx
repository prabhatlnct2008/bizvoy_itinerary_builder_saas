import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ActivityPreviewModal from './ActivityPreviewModal';
import { ActivityDetail } from '../../types';
import activitiesApi from '../../api/activities';
import {
  Search,
  Filter,
  X,
  Clock,
  MapPin,
  Star,
  Eye,
  Plus,
  Loader2,
} from 'lucide-react';

interface ActivityLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user adds an activity */
  onAddActivity: (activity: ActivityDetail, dayIndex: number) => void;
  /** Available days for adding */
  availableDays: { index: number; label: string }[];
  /** Current day index to default selection */
  currentDayIndex?: number;
}

const ActivityLibraryModal: React.FC<ActivityLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddActivity,
  availableDays,
  currentDayIndex = 0,
}) => {
  const [activities, setActivities] = useState<ActivityDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [showFilters, setShowFilters] = useState(false);

  // Preview modal
  const [previewActivity, setPreviewActivity] = useState<ActivityDetail | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  // Fetch activities on mount
  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await activitiesApi.getActivities({ status: 'active' });
      setActivities(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique categories and tags from activities
  const { categories, allTags } = useMemo(() => {
    const categorySet = new Set<string>();
    const tagSet = new Set<string>();

    activities.forEach((activity) => {
      if (activity.category_label) {
        categorySet.add(activity.category_label);
      }
      if (activity.tags) {
        try {
          const parsed = JSON.parse(activity.tags);
          if (Array.isArray(parsed)) {
            parsed.forEach((t: string) => tagSet.add(t));
          }
        } catch {
          activity.tags.split(',').forEach((t) => {
            const trimmed = t.trim();
            if (trimmed) tagSet.add(trimmed);
          });
        }
      }
    });

    return {
      categories: Array.from(categorySet).sort(),
      allTags: Array.from(tagSet).sort(),
    };
  }, [activities]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          activity.name?.toLowerCase().includes(query) ||
          activity.short_description?.toLowerCase().includes(query) ||
          activity.location_display?.toLowerCase().includes(query) ||
          activity.category_label?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && activity.category_label !== selectedCategory) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const activityTags: string[] = [];
        if (activity.tags) {
          try {
            const parsed = JSON.parse(activity.tags);
            if (Array.isArray(parsed)) {
              activityTags.push(...parsed);
            }
          } catch {
            activityTags.push(...activity.tags.split(',').map((t) => t.trim()));
          }
        }
        const hasAllTags = selectedTags.every((tag) =>
          activityTags.some((at) => at.toLowerCase() === tag.toLowerCase())
        );
        if (!hasAllTags) return false;
      }

      // Price range filter
      if (priceRange.min !== null || priceRange.max !== null) {
        const price = activity.base_price || 0;
        if (priceRange.min !== null && price < priceRange.min) return false;
        if (priceRange.max !== null && price > priceRange.max) return false;
      }

      return true;
    });
  }, [activities, searchQuery, selectedCategory, selectedTags, priceRange]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTags([]);
    setPriceRange({ min: null, max: null });
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTags.length > 0 || priceRange.min !== null || priceRange.max !== null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const formatDuration = (value: number | null | undefined, unit: string | null | undefined) => {
    if (!value) return null;
    if (unit === 'minutes') return `${value} mins`;
    if (unit === 'hours') return value === 1 ? '1 hour' : `${value} hours`;
    return `${value} ${unit || ''}`;
  };

  const getHeroImageUrl = (activity: ActivityDetail) => {
    const heroImage = activity.images?.find((img) => img.is_hero || img.is_primary) || activity.images?.[0];
    if (!heroImage) return null;
    if ((heroImage as any).file_url) {
      const url = (heroImage as any).file_url;
      return url.startsWith('http') ? url : `${baseUrl}${url}`;
    }
    if (heroImage.file_path) return `${baseUrl}/uploads/${heroImage.file_path}`;
    return null;
  };

  const handleAddActivity = (activity: ActivityDetail, dayIndex: number) => {
    onAddActivity(activity, dayIndex);
    setPreviewActivity(null);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Activity Library"
        size="full"
        hideHeader={false}
      >
        <div className="flex flex-col h-full">
          {/* Search and Filter Bar */}
          <div className="flex-shrink-0 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search activities..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {[selectedCategory, ...selectedTags, priceRange.min !== null ? 'price' : null].filter(Boolean).length}
                  </span>
                )}
              </Button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="secondary" onClick={clearFilters} className="text-slate-500">
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Price Range
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min ?? ''}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            min: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max ?? ''}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            max: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Tags/Vibes */}
                {allTags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tags / Vibes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.slice(0, 20).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-amber-500 text-white'
                              : 'bg-white border border-slate-300 text-slate-600 hover:border-amber-500'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-red-500">{error}</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Search className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium">No activities found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActivities.map((activity) => {
                  const heroImageUrl = getHeroImageUrl(activity);
                  const duration = formatDuration(activity.default_duration_value, activity.default_duration_unit);

                  return (
                    <div
                      key={activity.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      {/* Image */}
                      <div className="aspect-video bg-slate-100 relative">
                        {heroImageUrl ? (
                          <img
                            src={heroImageUrl}
                            alt={activity.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            No image
                          </div>
                        )}

                        {/* Quick Actions Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPreviewActivity(activity)}
                            className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-5 h-5 text-slate-700" />
                          </button>
                          <button
                            onClick={() => handleAddActivity(activity, currentDayIndex)}
                            className="p-2 bg-amber-500 rounded-full hover:bg-amber-600 transition-colors"
                            title="Quick Add"
                          >
                            <Plus className="w-5 h-5 text-white" />
                          </button>
                        </div>

                        {/* Category Badge */}
                        {activity.category_label && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-1 bg-white/90 text-slate-700 text-xs font-medium rounded-full">
                              {activity.category_label}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 truncate">{activity.name}</h3>

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          {duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {duration}
                            </span>
                          )}
                          {activity.location_display && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{activity.location_display}</span>
                            </span>
                          )}
                          {activity.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              {activity.rating}
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        {activity.base_price && (
                          <div className="mt-3 text-sm font-semibold text-amber-600">
                            ${activity.base_price}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {filteredActivities.length} of {activities.length} activities
            </span>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Activity Preview Modal */}
      <ActivityPreviewModal
        isOpen={!!previewActivity}
        onClose={() => setPreviewActivity(null)}
        activity={previewActivity || undefined}
        onAddToDay={handleAddActivity}
        availableDays={availableDays}
        hideAddButton={false}
      />
    </>
  );
};

export default ActivityLibraryModal;
