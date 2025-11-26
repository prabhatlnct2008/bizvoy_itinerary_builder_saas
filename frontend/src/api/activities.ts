import client from './client';
import {
  ActivityDetail,
  ActivityCreate,
  ActivityUpdate,
  ActivitySearchRequest,
  ActivityImage,
  MessageResponse,
} from '../types';

export const activitiesApi = {
  // Get all activities with optional filters
  async getActivities(params?: {
    type?: string;
    location?: string;
    status?: string;
    search?: string;
  }): Promise<ActivityDetail[]> {
    // Convert frontend params to backend params
    const backendParams: any = {};

    if (params?.type) {
      backendParams.activity_type_id = params.type;
    }

    if (params?.status) {
      if (params.status === 'active') {
        backendParams.is_active = true;
      } else if (params.status === 'inactive') {
        backendParams.is_active = false;
      }
    }

    const response = await client.get('/api/v1/activities', { params: backendParams });
    return response.data;
  },

  // Semantic search activities
  async searchActivities(data: ActivitySearchRequest): Promise<ActivityDetail[]> {
    const response = await client.post('/api/v1/activities/search', data);
    return response.data;
  },

  // Get activity by ID
  async getActivity(id: string): Promise<ActivityDetail> {
    const response = await client.get(`/api/v1/activities/${id}`);
    return response.data;
  },

  // Create activity
  async createActivity(data: ActivityCreate): Promise<ActivityDetail> {
    const response = await client.post('/api/v1/activities', data);
    return response.data;
  },

  // Update activity
  async updateActivity(id: string, data: ActivityUpdate): Promise<ActivityDetail> {
    const response = await client.put(`/api/v1/activities/${id}`, data);
    return response.data;
  },

  // Delete activity
  async deleteActivity(id: string): Promise<MessageResponse> {
    const response = await client.delete(`/api/v1/activities/${id}`);
    return response.data;
  },

  // Upload activity image
  async uploadImage(activityId: string, file: File): Promise<ActivityImage> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await client.post(
      `/api/v1/activities/${activityId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Delete activity image
  async deleteImage(activityId: string, imageId: string): Promise<MessageResponse> {
    const response = await client.delete(`/api/v1/activities/${activityId}/images/${imageId}`);
    return response.data;
  },
};

export default activitiesApi;
