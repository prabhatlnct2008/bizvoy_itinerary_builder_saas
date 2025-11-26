import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Chip from '../../components/ui/Chip';
import Dropdown from '../../components/ui/Dropdown';
import { usePermissions } from '../../hooks/usePermissions';
import activitiesApi from '../../api/activities';
import activityTypesApi from '../../api/activityTypes';
import { ActivityDetail, ActivityType } from '../../types';

const ActivityList: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityDetail[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { hasPermission } = usePermissions();

  const canView = hasPermission('activities.view');
  const canCreate = hasPermission('activities.create');
  const canDelete = hasPermission('activities.delete');

  useEffect(() => {
    if (canView) {
      fetchActivityTypes();
      fetchActivities();
    }
  }, [canView]);

  useEffect(() => {
    if (canView) {
      fetchActivities();
    }
  }, [filterType, filterStatus]);

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
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const data = await activitiesApi.getActivities(params);
      setActivities(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load activities');
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
      toast.success(`Found ${data.length} activities`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (activity: ActivityDetail) => {
    if (!window.confirm(`Delete activity "${activity.name}"?`)) {
      return;
    }

    try {
      await activitiesApi.deleteActivity(activity.id);
      toast.success('Activity deleted successfully');
      fetchActivities();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete activity');
    }
  };

  if (!canView) {
    return (
      <div className="p-6 text-center text-muted">
        You don't have permission to view activities.
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Activity Name',
      width: '30%',
    },
    {
      key: 'location',
      header: 'Location',
      render: (activity: ActivityDetail) => (
        <span className="text-muted">{activity.location || '-'}</span>
      ),
    },
    {
      key: 'base_price',
      header: 'Price',
      render: (activity: ActivityDetail) => (
        <span className="text-muted">
          {activity.base_price ? `$${activity.base_price}` : '-'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (activity: ActivityDetail) => (
        <Chip
          label={activity.is_active ? 'Active' : 'Inactive'}
          variant={activity.is_active ? 'success' : 'default'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (activity: ActivityDetail) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/activities/${activity.id}`);
            }}
            className="text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            Edit
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(activity);
              }}
              className="text-error hover:text-red-600 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Activities Library</h1>
          <p className="text-secondary mt-1">Manage reusable activities</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/activities/new')}>Add Activity</Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search activities (semantic search)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex gap-2">
            <Dropdown
              options={[
                { value: '', label: 'All Types' },
                ...activityTypes.map((type) => ({
                  value: type.id,
                  label: type.name,
                })),
              ]}
              value={filterType}
              onChange={(value) => setFilterType(value)}
              placeholder="Filter by type"
            />
            <Dropdown
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              placeholder="Filter by status"
            />
          </div>
          <div>
            <Button
              onClick={handleSearch}
              isLoading={isSearching}
              variant="secondary"
              className="w-full"
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          data={activities}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No activities found. Add your first activity to get started."
          onRowClick={(activity) => navigate(`/activities/${activity.id}`)}
        />
      </div>
    </div>
  );
};

export default ActivityList;
