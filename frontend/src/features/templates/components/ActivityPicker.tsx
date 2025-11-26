import React, { useState, useEffect } from 'react';
import { ActivityDetail, ActivityType } from '../../../types';
import activitiesApi from '../../../api/activities';
import activityTypesApi from '../../../api/activityTypes';
import Input from '../../../components/ui/Input';
import Dropdown from '../../../components/ui/Dropdown';
import Button from '../../../components/ui/Button';
import { Search, Plus, MapPin, DollarSign } from 'lucide-react';

interface ActivityPickerProps {
  onSelectActivity: (activity: ActivityDetail) => void;
  selectedActivityIds?: string[];
}

const ActivityPicker: React.FC<ActivityPickerProps> = ({
  onSelectActivity,
  selectedActivityIds = [],
}) => {
  const [activities, setActivities] = useState<ActivityDetail[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchActivityTypes();
    fetchActivities();
  }, []);

  useEffect(() => {
    fetchActivities();
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchActivities();
      return;
    }

    try {
      setIsSearching(true);
      const data = await activitiesApi.searchActivities({
        query: searchQuery,
        limit: 50,
      });
      setActivities(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredActivities = activities.filter(
    (activity) => !selectedActivityIds.includes(activity.id)
  );

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} isLoading={isSearching} variant="secondary" size="sm">
            <Search className="w-4 h-4" />
          </Button>
        </div>

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

      {/* Activities List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="text-sm">
              {searchQuery || filterType
                ? 'No activities found matching your filters'
                : 'No activities available'}
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => onSelectActivity(activity)}
              className="w-full p-4 text-left bg-white hover:bg-gray-50 rounded-lg border border-border hover:border-primary-300 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-primary group-hover:text-primary-600 transition-colors">
                    {activity.name}
                  </h4>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                    {activity.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{activity.location}</span>
                      </div>
                    )}
                    {activity.base_price && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>${activity.base_price}</span>
                      </div>
                    )}
                  </div>

                  {activity.short_description && (
                    <p className="text-xs text-muted mt-2 line-clamp-2">
                      {activity.short_description}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Summary */}
      {!isLoading && filteredActivities.length > 0 && (
        <div className="pt-3 border-t border-border text-xs text-muted">
          Showing {filteredActivities.length}{' '}
          {filteredActivities.length === 1 ? 'activity' : 'activities'}
        </div>
      )}
    </div>
  );
};

export default ActivityPicker;
