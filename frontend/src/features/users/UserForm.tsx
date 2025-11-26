import React, { useState, useEffect } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import rolesApi from '../../api/roles';
import { UserWithRoles, UserCreate, UserUpdate, Role } from '../../types';

interface UserFormProps {
  user: UserWithRoles | null;
  onSubmit: (data: UserCreate | UserUpdate) => Promise<void>;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    full_name: user?.full_name || '',
    password: '',
    is_active: user?.is_active ?? true,
    is_superuser: user?.is_superuser ?? false,
    role_ids: [] as string[],
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const data = await rolesApi.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        email: formData.email,
        full_name: formData.full_name,
        is_active: formData.is_active,
        is_superuser: formData.is_superuser,
        role_ids: selectedRoles,
        ...(formData.password && { password: formData.password }),
      };

      await onSubmit(submitData);
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        required
      />

      <Input
        label="Full Name"
        type="text"
        value={formData.full_name}
        onChange={(e) => handleChange('full_name', e.target.value)}
        error={errors.full_name}
        required
      />

      <Input
        label={user ? 'Password (leave blank to keep current)' : 'Password'}
        type="password"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        error={errors.password}
        required={!user}
      />

      {/* Roles Selection */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Roles
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
          {roles.length === 0 ? (
            <p className="text-sm text-muted">No roles available</p>
          ) : (
            roles.map((role) => (
              <label
                key={role.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <span className="text-sm text-primary">{role.name}</span>
                  {role.description && (
                    <p className="text-xs text-muted">{role.description}</p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Status Toggles */}
      <div className="space-y-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
          />
          <span className="text-sm text-primary">Active</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_superuser}
            onChange={(e) => handleChange('is_superuser', e.target.checked)}
            className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
          />
          <div>
            <span className="text-sm text-primary">Superuser (Admin)</span>
            <p className="text-xs text-muted">
              Full access to all features in the agency
            </p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
