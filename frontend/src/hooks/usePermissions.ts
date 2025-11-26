import { useAuthStore } from '../store/authStore';
import { hasPermission as checkPermission, hasAnyPermission, hasAllPermissions } from '../utils/rbac';

/**
 * Hook to check user permissions
 * @returns Object with permission checking functions
 */
export const usePermissions = () => {
  const { user, permissions } = useAuthStore();

  const hasPermission = (codename: string): boolean => {
    return checkPermission(user, codename, permissions);
  };

  const hasAny = (codenames: string[]): boolean => {
    return hasAnyPermission(user, codenames, permissions);
  };

  const hasAll = (codenames: string[]): boolean => {
    return hasAllPermissions(user, codenames, permissions);
  };

  const isSuperuser = user?.is_superuser || false;

  return {
    hasPermission,
    hasAny,
    hasAll,
    isSuperuser,
    permissions,
  };
};
