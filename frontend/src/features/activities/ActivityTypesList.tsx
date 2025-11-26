import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
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
      <div className="p-6 text-center text-muted">
        You don't have permission to view activity types.
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Type Name',
      width: '30%',
    },
    {
      key: 'description',
      header: 'Description',
      width: '40%',
      render: (type: ActivityType) => (
        <span className="text-muted">{type.description || '-'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (type: ActivityType) => (
        <span className="text-muted">
          {new Date(type.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (type: ActivityType) => (
        <div className="flex gap-2">
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(type);
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
          <h1 className="text-2xl font-semibold text-primary">Activity Types</h1>
          <p className="text-secondary mt-1">Define categories for your activities</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>+ Add Type</Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : activityTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted mb-4">No activity types yet</p>
            {canCreate && (
              <Button onClick={handleCreate}>Create your first type</Button>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Stay, Meal, Experience"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Hotels, resorts, and other accommodations"
            />
            <p className="mt-1 text-xs text-gray-500">
              Brief description of this activity type
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {editingType ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ActivityTypesList;
