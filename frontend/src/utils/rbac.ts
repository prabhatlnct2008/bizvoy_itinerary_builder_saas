import { UserWithRoles } from '../types';

/**
 * Check if a user has a specific permission
 * @param user - User object with roles
 * @param codename - Permission codename (e.g., "itineraries.view")
 * @param userPermissions - Array of permission codenames
 * @returns boolean indicating if user has permission
 */
export const hasPermission = (
  user: UserWithRoles | null,
  codename: string,
  userPermissions: string[] = []
): boolean => {
  // Superuser has all permissions
  if (user?.is_superuser) {
    return true;
  }

  // Check if permission exists in user's permissions list
  return userPermissions.includes(codename);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  user: UserWithRoles | null,
  codenames: string[],
  userPermissions: string[] = []
): boolean => {
  if (user?.is_superuser) {
    return true;
  }

  return codenames.some((codename) => userPermissions.includes(codename));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (
  user: UserWithRoles | null,
  codenames: string[],
  userPermissions: string[] = []
): boolean => {
  if (user?.is_superuser) {
    return true;
  }

  return codenames.every((codename) => userPermissions.includes(codename));
};

/**
 * Get user permissions by module
 */
export const getPermissionsByModule = (
  permissions: string[],
  module: string
): string[] => {
  return permissions.filter((perm) => perm.startsWith(`${module}.`));
};
