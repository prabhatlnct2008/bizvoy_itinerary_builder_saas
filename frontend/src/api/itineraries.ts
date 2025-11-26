import client from './client';
import {
  Itinerary,
  ItineraryDetail,
  ItineraryCreate,
  ItineraryUpdate,
  MessageResponse,
} from '../types';

export const itinerariesApi = {
  // Get all itineraries with optional filters
  async getItineraries(params?: {
    status?: string;
    destination?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Itinerary[]> {
    const response = await client.get('/api/v1/itineraries', { params });
    return response.data;
  },

  // Get itinerary by ID with full structure
  async getItinerary(id: string): Promise<ItineraryDetail> {
    const response = await client.get(`/api/v1/itineraries/${id}`);
    return response.data;
  },

  // Create itinerary (from template or scratch)
  async createItinerary(data: ItineraryCreate): Promise<ItineraryDetail> {
    const response = await client.post('/api/v1/itineraries', data);
    return response.data;
  },

  // Update itinerary
  async updateItinerary(id: string, data: ItineraryUpdate): Promise<ItineraryDetail> {
    const response = await client.put(`/api/v1/itineraries/${id}`, data);
    return response.data;
  },

  // Delete itinerary
  async deleteItinerary(id: string): Promise<MessageResponse> {
    const response = await client.delete(`/api/v1/itineraries/${id}`);
    return response.data;
  },
};

export default itinerariesApi;
