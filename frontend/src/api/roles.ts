import client from './client';
import {
  Role,
  RoleWithPermissions,
  RoleCreate,
  RoleUpdate,
  Permission,
  MessageResponse,
} from '../types';

export const rolesApi = {
  // Get all roles in agency
  async getRoles(): Promise<Role[]> {
    const response = await client.get('/api/v1/roles');
    return response.data;
  },

  // Get role by ID with permissions
  async getRole(id: string): Promise<RoleWithPermissions> {
    const response = await client.get(`/api/v1/roles/${id}`);
    return response.data;
  },

  // Create new role
  async createRole(data: RoleCreate): Promise<RoleWithPermissions> {
    const response = await client.post('/api/v1/roles', data);
    return response.data;
  },

  // Update role
  async updateRole(id: string, data: RoleUpdate): Promise<RoleWithPermissions> {
    const response = await client.put(`/api/v1/roles/${id}`, data);
    return response.data;
  },

  // Delete role
  async deleteRole(id: string): Promise<MessageResponse> {
    const response = await client.delete(`/api/v1/roles/${id}`);
    return response.data;
  },

  // Get all system permissions
  async getPermissions(): Promise<Permission[]> {
    const response = await client.get('/api/v1/roles/permissions');
    return response.data;
  },
};

export default rolesApi;
