import client from './client';
import { ActivityType, ActivityTypeCreate, MessageResponse } from '../types';

export const activityTypesApi = {
  // Get all activity types
  async getActivityTypes(): Promise<ActivityType[]> {
    const response = await client.get('/api/v1/activity-types');
    return response.data;
  },

  // Create activity type
  async createActivityType(data: ActivityTypeCreate): Promise<ActivityType> {
    const response = await client.post('/api/v1/activity-types', data);
    return response.data;
  },

  // Delete activity type
  async deleteActivityType(id: string): Promise<MessageResponse> {
    const response = await client.delete(`/api/v1/activity-types/${id}`);
    return response.data;
  },
};

export default activityTypesApi;
