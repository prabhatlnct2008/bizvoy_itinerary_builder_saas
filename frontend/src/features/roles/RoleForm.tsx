import React, { useState, useEffect } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import rolesApi from '../../api/roles';
import {
  RoleWithPermissions,
  RoleCreate,
  RoleUpdate,
  Permission,
} from '../../types';

interface RoleFormProps {
  role: RoleWithPermissions | null;
  onSubmit: (data: RoleCreate | RoleUpdate) => Promise<void>;
  onCancel: () => void;
}

// Group permissions by module
interface PermissionsByModule {
  [module: string]: Permission[];
}

const RoleForm: React.FC<RoleFormProps> = ({ role, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
  });

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role?.permissions.map((p) => p.id) || [])
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const data = await rolesApi.getPermissions();
      setAllPermissions(data);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  // Group permissions by module
  const permissionsByModule: PermissionsByModule = allPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    },
    {} as PermissionsByModule
  );

  // Get all unique actions
  const allActions = Array.from(
    new Set(allPermissions.map((p) => p.action))
  ).sort();

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const toggleAllInModule = (module: string) => {
    const modulePermissions = permissionsByModule[module];
    const allSelected = modulePermissions.every((p) =>
      selectedPermissions.has(p.id)
    );

    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      modulePermissions.forEach((p) => {
        if (allSelected) {
          newSet.delete(p.id);
        } else {
          newSet.add(p.id);
        }
      });
      return newSet;
    });
  };

  const toggleAllForAction = (action: string) => {
    const actionPermissions = allPermissions.filter((p) => p.action === action);
    const allSelected = actionPermissions.every((p) =>
      selectedPermissions.has(p.id)
    );

    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      actionPermissions.forEach((p) => {
        if (allSelected) {
          newSet.delete(p.id);
        } else {
          newSet.add(p.id);
        }
      });
      return newSet;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
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
        name: formData.name,
        description: formData.description || null,
        permission_ids: Array.from(selectedPermissions),
      };

      await onSubmit(submitData);
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Role Name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g., Itinerary Manager"
          required
        />

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            rows={3}
            placeholder="Describe the purpose of this role"
          />
        </div>
      </div>

      {/* Permissions Matrix */}
      <div>
        <h3 className="text-lg font-semibold text-primary mb-4">
          Permissions Matrix
        </h3>

        {allPermissions.length === 0 ? (
          <p className="text-muted text-center py-4">Loading permissions...</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="bg-gray-50 border-b border-border">
              <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(80px,1fr))] gap-2 p-3">
                <div className="font-medium text-sm text-secondary">Module</div>
                {allActions.map((action) => (
                  <div key={action} className="text-center">
                    <button
                      type="button"
                      onClick={() => toggleAllForAction(action)}
                      className="text-xs font-medium text-secondary uppercase hover:text-primary-600 transition-colors"
                    >
                      {action}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Permission Rows */}
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {Object.entries(permissionsByModule).map(
                ([module, permissions]) => {
                  return (
                    <div key={module} className="hover:bg-gray-50">
                      <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(80px,1fr))] gap-2 p-3 items-center">
                        <button
                          type="button"
                          onClick={() => toggleAllInModule(module)}
                          className="text-left font-medium text-sm text-primary hover:text-primary-600 transition-colors capitalize"
                        >
                          {module}
                        </button>

                        {allActions.map((action) => {
                          const permission = permissions.find(
                            (p) => p.action === action
                          );

                          return (
                            <div key={action} className="flex justify-center">
                              {permission ? (
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.has(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                  className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500 cursor-pointer"
                                />
                              ) : (
                                <span className="text-muted text-xs">-</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted mt-3">
          Selected {selectedPermissions.size} of {allPermissions.length}{' '}
          permissions
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {role ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </form>
  );
};

export default RoleForm;
