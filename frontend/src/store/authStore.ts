import { create } from 'zustand';
import { UserWithRoles } from '../types';
import { authAPI } from '../api/auth';
import { toast } from 'react-toastify';

interface AuthState {
  user: UserWithRoles | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: string[]; // Array of permission codenames
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: UserWithRoles, permissions?: string[]) => void;
  setPermissions: (permissions: string[]) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });

      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      // Decode the JWT to get user info and permissions
      const tokenParts = response.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));

        // Extract user data and permissions from token
        const user: UserWithRoles = {
          id: payload.sub,
          agency_id: payload.agency_id || '',
          email: payload.email || email,
          full_name: payload.full_name || 'User',
          is_active: true,
          is_superuser: payload.is_superuser || false,
          is_bizvoy_admin: payload.is_bizvoy_admin || false,
          force_password_reset: payload.force_password_reset || false,
          created_at: '',
          updated_at: '',
          roles: [], // Will be fetched separately if needed
        };

        const permissions = payload.permissions || [];

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('permissions', JSON.stringify(permissions));

        set({
          user,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          permissions,
          isAuthenticated: true,
          isLoading: false,
        });
      }

      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });

    toast.info('Logged out successfully');
  },

  setUser: (user: UserWithRoles, permissions?: string[]) => {
    set({ user });
    if (permissions) {
      set({ permissions });
      localStorage.setItem('permissions', JSON.stringify(permissions));
    }
  },

  setPermissions: (permissions: string[]) => {
    set({ permissions });
    localStorage.setItem('permissions', JSON.stringify(permissions));
  },

  initializeAuth: () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('user');
    const permissionsStr = localStorage.getItem('permissions');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        const permissions = permissionsStr ? JSON.parse(permissionsStr) : [];

        set({
          user,
          accessToken,
          refreshToken,
          permissions,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
