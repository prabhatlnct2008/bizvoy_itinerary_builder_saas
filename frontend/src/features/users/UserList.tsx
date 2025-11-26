import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Chip from '../../components/ui/Chip';
import UserForm from './UserForm';
import { usePermissions } from '../../hooks/usePermissions';
import usersApi from '../../api/users';
import { UserWithRoles, UserCreate, UserUpdate } from '../../types';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const { hasPermission } = usePermissions();

  const canView = hasPermission('users.view');
  const canCreate = hasPermission('users.create');
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');

  useEffect(() => {
    if (canView) {
      fetchUsers();
    }
  }, [canView]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: UserWithRoles) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: UserWithRoles) => {
    if (!window.confirm(`Are you sure you want to delete ${user.full_name}?`)) {
      return;
    }

    try {
      await usersApi.deleteUser(user.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleSubmit = async (data: UserCreate | UserUpdate) => {
    try {
      if (editingUser) {
        await usersApi.updateUser(editingUser.id, data as UserUpdate);
        toast.success('User updated successfully');
      } else {
        await usersApi.createUser(data as UserCreate);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save user');
      throw error;
    }
  };

  if (!canView) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-6 text-center text-slate-500">
        You don't have permission to view users.
      </div>
    );
  }

  const columns = [
    {
      key: 'full_name',
      header: 'Name',
      render: (user: UserWithRoles) => (
        <span className="font-medium text-slate-900">{user.full_name}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user: UserWithRoles) => (
        <span className="text-slate-700">{user.email}</span>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (user: UserWithRoles) => (
        <span className="text-slate-500 text-xs">
          {user.roles.length > 0 ? user.roles.join(', ') : 'No roles'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user: UserWithRoles) => (
        <Chip
          label={user.is_active ? 'Active' : 'Inactive'}
          variant={user.is_active ? 'success' : 'default'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: UserWithRoles) => (
        <div className="flex gap-3 justify-end">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(user);
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
                handleDelete(user);
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
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage agency staff members.</p>
        </div>
        {canCreate && (
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            Add user
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Table
          data={users}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No users found. Add your first user to get started."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
        size="md"
      >
        <UserForm
          user={editingUser}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default UserList;
