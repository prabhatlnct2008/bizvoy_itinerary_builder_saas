import client from './client';
import { UserWithRoles, UserCreate, UserUpdate, MessageResponse } from '../types';

export const usersApi = {
  // Get all users in agency
  async getUsers(): Promise<UserWithRoles[]> {
    const response = await client.get('/api/v1/users');
    return response.data;
  },

  // Get user by ID
  async getUser(id: string): Promise<UserWithRoles> {
    const response = await client.get(`/api/v1/users/${id}`);
    return response.data;
  },

  // Create new user
  async createUser(data: UserCreate): Promise<UserWithRoles> {
    const response = await client.post('/api/v1/users', data);
    return response.data;
  },

  // Update user
  async updateUser(id: string, data: UserUpdate): Promise<UserWithRoles> {
    const response = await client.put(`/api/v1/users/${id}`, data);
    return response.data;
  },

  // Delete user
  async deleteUser(id: string): Promise<MessageResponse> {
    const response = await client.delete(`/api/v1/users/${id}`);
    return response.data;
  },
};

export default usersApi;
