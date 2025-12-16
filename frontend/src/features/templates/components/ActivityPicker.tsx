import React, { useState, useEffect } from 'react';
import { ActivityDetail, ActivityType } from '../../../types';
import activitiesApi from '../../../api/activities';
import activityTypesApi from '../../../api/activityTypes';
import Input from '../../../components/ui/Input';
import Dropdown from '../../../components/ui/Dropdown';
import Button from '../../../components/ui/Button';
import ActivityPreviewModal from '../../../components/modals/ActivityPreviewModal';
import { Search, Plus, MapPin, DollarSign, Sparkles } from 'lucide-react';

interface ActivityPickerProps {
  onSelectActivity: (activity: ActivityDetail, dayIndex?: number) => void;
  selectedActivityIds?: string[];
  availableDays?: { index: number; label: string }[];
  defaultDayIndex?: number;
}

const ActivityPicker: React.FC<ActivityPickerProps> = ({
  onSelectActivity,
  selectedActivityIds = [],
  availableDays = [],
  defaultDayIndex = 0,
}) => {
  const RESULT_LIMIT = 10;
  const [activities, setActivities] = useState<ActivityDetail[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [previewActivity, setPreviewActivity] = useState<ActivityDetail | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchActivityTypes();
    fetchActivities();
  }, []);

  useEffect(() => {
    // If user already queried, re-run semantic search when filter changes; otherwise pull fresh list
    if (searchQuery.trim()) {
      runSemanticSearch(searchQuery);
    } else {
      fetchActivities();
    }
  }, [filterType]);

  const fetchActivityTypes = async () => {
    try {
      const data = await activityTypesApi.getActivityTypes();
      setActivityTypes(data);
    } catch (error) {
      console.error('Failed to load activity types:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const params: any = { status: 'active' };
      if (filterType) params.type = filterType;
      const data = await activitiesApi.getActivities(params);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSemanticSearch = async (query: string) => {
    if (!query.trim()) {
      fetchActivities();
      return;
    }

    try {
      setIsLoading(true);
      setIsSearching(true);
      const data = await activitiesApi.searchActivities({
        query,
        limit: RESULT_LIMIT,
        activity_type_id: filterType || undefined,
        is_active: true,
      });
      setActivities(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    await runSemanticSearch(searchQuery);
  };

  const filteredActivities = activities.filter(
    (activity) => !selectedActivityIds.includes(activity.id)
  );

  const samplePrompts = [
    '3 beach activities with great sunsets near Goa',
    'family-friendly food tours in Barcelona',
    'luxury spa day and brunch options',
  ];

  const handlePreview = (activity: ActivityDetail) => {
    setPreviewActivity(activity);
    setIsPreviewOpen(true);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Search bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Describe what you need... e.g., sunset cruise with dinner near the beach"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-11 pr-4 py-3 text-base"
            />
          </div>
          <Button onClick={handleSearch} isLoading={isSearching}>
            Search
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-medium">Try a chat-style query:</span>
          {samplePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setSearchQuery(prompt);
                runSemanticSearch(prompt);
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[12px] hover:border-amber-500 hover:text-amber-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="min-w-[200px]">
            <Dropdown
              options={[
                { value: '', label: 'All Activity Types' },
                ...activityTypes.map((type) => ({
                  value: type.id,
                  label: type.name,
                })),
              ]}
              value={filterType}
              onChange={(value) => setFilterType(value)}
              placeholder="Filter by type"
            />
          </div>
          <span className="text-xs text-slate-500">Showing top {RESULT_LIMIT} matches</span>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2 text-sm text-slate-500">
          <span>
            {searchQuery
              ? `Results for "${searchQuery}"`
              : 'Browse recent activities'}
          </span>
          {isSearching && <span className="text-amber-600">Searching…</span>}
        </div>
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <p className="text-sm">No activities found. Try a different question.</p>
              <button
                onClick={() => {
                  setSearchQuery(samplePrompts[0]);
                  runSemanticSearch(samplePrompts[0]);
                }}
                className="text-amber-600 text-sm font-medium hover:text-amber-700"
              >
                Use an example query
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
              {filteredActivities.map((activity) => {
                const location = activity.location_display || activity.location;
                const price = activity.cost_display || activity.base_price;

                return (
                  <div
                    key={activity.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-primary leading-tight">
                          {activity.name}
                        </h4>
                        <button
                          onClick={() => onSelectActivity(activity)}
                          className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                      {activity.short_description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {activity.short_description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {location}
                          </span>
                        )}
                        {price && (
                          <span className="inline-flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {price}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePreview(activity)}
                      >
                        Preview
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => onSelectActivity(activity)}>
                        Add to day
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ActivityPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        activityId={previewActivity?.id}
        onAddToDay={(activity, dayIndex) => {
          onSelectActivity(activity, dayIndex);
          setIsPreviewOpen(false);
          setPreviewActivity(null);
        }}
        availableDays={availableDays}
        defaultDayIndex={defaultDayIndex}
      />
    </div>
  );
};

export default ActivityPicker;
