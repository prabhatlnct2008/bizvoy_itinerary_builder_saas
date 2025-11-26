import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import RoleForm from './RoleForm';
import { usePermissions } from '../../hooks/usePermissions';
import rolesApi from '../../api/roles';
import { Role, RoleWithPermissions, RoleCreate, RoleUpdate } from '../../types';

const RoleList: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const { hasPermission } = usePermissions();

  const canView = hasPermission('roles.view');
  const canCreate = hasPermission('roles.create');
  const canEdit = hasPermission('roles.edit');
  const canDelete = hasPermission('roles.delete');

  useEffect(() => {
    if (canView) {
      fetchRoles();
    }
  }, [canView]);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const data = await rolesApi.getRoles();
      setRoles(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (role: Role) => {
    try {
      const fullRole = await rolesApi.getRole(role.id);
      setEditingRole(fullRole);
      setIsModalOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load role details');
    }
  };

  const handleDelete = async (role: Role) => {
    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    try {
      await rolesApi.deleteRole(role.id);
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete role');
    }
  };

  const handleSubmit = async (data: RoleCreate | RoleUpdate) => {
    try {
      if (editingRole) {
        await rolesApi.updateRole(editingRole.id, data as RoleUpdate);
        toast.success('Role updated successfully');
      } else {
        await rolesApi.createRole(data as RoleCreate);
        toast.success('Role created successfully');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save role');
      throw error;
    }
  };

  if (!canView) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-6 text-center text-slate-500">
        You don't have permission to view roles.
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Role name',
      render: (role: Role) => (
        <span className="font-medium text-slate-900">{role.name}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (role: Role) => (
        <span className="text-slate-500 text-xs">
          {role.description || 'No description'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (role: Role) => (
        <span className="text-slate-500 text-xs">
          {new Date(role.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (role: Role) => (
        <div className="flex gap-3 justify-end">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(role);
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(role);
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
          <h1 className="text-xl font-semibold text-slate-900">Roles</h1>
          <p className="text-sm text-slate-500">Define access levels for your team.</p>
        </div>
        {canCreate && (
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            Create role
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Table
          data={roles}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No roles found. Create your first role to get started."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Create Role'}
        size="xl"
      >
        <RoleForm
          role={editingRole}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default RoleList;
