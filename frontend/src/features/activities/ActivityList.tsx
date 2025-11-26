import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/ui/Table';
import Chip from '../../components/ui/Chip';
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
      <div className="max-w-6xl mx-auto px-5 py-6 text-center text-slate-500">
        You don't have permission to view activities.
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Activity name',
      width: '30%',
      render: (activity: ActivityDetail) => (
        <span className="font-medium text-slate-900">{activity.name}</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (activity: ActivityDetail) => (
        <span className="text-slate-700">{activity.location || '-'}</span>
      ),
    },
    {
      key: 'base_price',
      header: 'Price',
      render: (activity: ActivityDetail) => (
        <span className="text-slate-700">
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
        <div className="flex gap-3 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/activities/${activity.id}`);
            }}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(activity);
              }}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Activities</h1>
          <p className="text-sm text-slate-500">Manage reusable activities for itineraries.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/activities/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            Add activity
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search activities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All types</option>
          {activityTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="border border-slate-300 bg-white text-slate-700 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
