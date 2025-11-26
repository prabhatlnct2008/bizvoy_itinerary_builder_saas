import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { usePermissions } from '../../hooks/usePermissions';
import activityTypesApi from '../../api/activityTypes';
import { ActivityType, ActivityTypeCreate } from '../../types';

const ActivityTypesList: React.FC = () => {
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ActivityType | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const { hasPermission } = usePermissions();

  const canView = hasPermission('activities.view');
  const canCreate = hasPermission('activities.create');
  const canDelete = hasPermission('activities.delete');

  useEffect(() => {
    if (canView) {
      fetchActivityTypes();
    }
  }, [canView]);

  const fetchActivityTypes = async () => {
    try {
      setIsLoading(true);
      const data = await activityTypesApi.getActivityTypes();
      setActivityTypes(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load activity types');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (type: ActivityType) => {
    setEditingType(type);
    setFormData({ name: type.name, description: type.description || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (type: ActivityType) => {
    if (!window.confirm(`Are you sure you want to delete "${type.name}"? This may affect activities using this type.`)) {
      return;
    }

    try {
      await activityTypesApi.deleteActivityType(type.id);
      toast.success('Activity type deleted successfully');
      fetchActivityTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete activity type');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setIsSaving(true);
      const data: ActivityTypeCreate = {
        name: formData.name,
        description: formData.description || undefined,
      };

      await activityTypesApi.createActivityType(data);
      toast.success(editingType ? 'Activity type updated successfully' : 'Activity type created successfully');
      setIsModalOpen(false);
      fetchActivityTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save activity type');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canView) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-6 text-center text-slate-500">
        You don't have permission to view activity types.
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Type name',
      width: '30%',
      render: (type: ActivityType) => (
        <span className="font-medium text-slate-900">{type.name}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      width: '40%',
      render: (type: ActivityType) => (
        <span className="text-slate-500 text-xs">{type.description || '-'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (type: ActivityType) => (
        <span className="text-slate-500 text-xs">
          {new Date(type.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (type: ActivityType) => (
        <div className="flex gap-3 justify-end">
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(type);
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
          <h1 className="text-xl font-semibold text-slate-900">Activity Types</h1>
          <p className="text-sm text-slate-500">Define categories for your activities.</p>
        </div>
        {canCreate && (
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            Add type
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activityTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500 mb-4">No activity types yet</p>
            {canCreate && (
              <button
                onClick={handleCreate}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Create your first type
              </button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={activityTypes}
            onRowClick={(type) => handleEdit(type)}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingType ? 'Edit Activity Type' : 'New Activity Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type Name *
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Stay, Meal, Experience"
              required
              autoFocus
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (Optional)
            </label>
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Hotels, resorts, and other accommodations"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Brief description of this activity type
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="border border-slate-300 bg-white text-slate-700 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingType ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ActivityTypesList;
