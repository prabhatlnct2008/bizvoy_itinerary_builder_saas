import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
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
      <div className="p-6 text-center text-muted">
        You don't have permission to view users.
      </div>
    );
  }

  const columns = [
    {
      key: 'full_name',
      header: 'Name',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (user: UserWithRoles) => (
        <span className="text-muted">
          {user.roles.length > 0 ? user.roles.join(', ') : 'No roles'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user: UserWithRoles) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.is_active
              ? 'bg-secondary-100 text-secondary-500'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: UserWithRoles) => (
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(user);
              }}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
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
          <h1 className="text-2xl font-semibold text-primary">Users</h1>
          <p className="text-secondary mt-1">Manage agency staff members</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>Add User</Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
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
