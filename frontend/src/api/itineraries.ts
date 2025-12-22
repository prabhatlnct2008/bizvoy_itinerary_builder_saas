import client from './client';
import {
  Itinerary,
  ItineraryDetail,
  ItineraryCreate,
  ItineraryUpdate,
  MessageResponse,
} from '../types';

// Payment types
export interface PaymentRecord {
  id: string;
  itinerary_id: string;
  payment_type: string;
  amount: number;
  currency: string;
  payment_method?: string;
  reference_number?: string;
  paid_at?: string;
  notes?: string;
  confirmed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PricingWithPayments {
  id: string;
  itinerary_id: string;
  base_package?: number;
  taxes_fees?: number;
  discount_code?: string;
  discount_amount?: number;
  discount_percent?: number;
  total?: number;
  currency: string;
  pricing_notes?: string;
  advance_enabled: boolean;
  advance_type?: string;
  advance_amount?: number;
  advance_percent?: number;
  advance_deadline?: string;
  final_deadline?: string;
  payments: PaymentRecord[];
  total_paid: number;
  balance_due: number;
  advance_required?: number;
  advance_paid: boolean;
}

export interface PaymentCreate {
  payment_type: string;
  amount: number;
  currency?: string;
  payment_method?: string;
  reference_number?: string;
  paid_at?: string;
  notes?: string;
}

export interface PricingUpdate {
  base_package?: number;
  taxes_fees?: number;
  discount_code?: string;
  discount_amount?: number;
  discount_percent?: number;
  total?: number;
  currency?: string;
  pricing_notes?: string;
  advance_enabled?: boolean;
  advance_type?: string;
  advance_amount?: number;
  advance_percent?: number;
  advance_deadline?: string;
  final_deadline?: string;
}

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

  // ============== PRICING & PAYMENTS ==============

  // Get itinerary pricing with payments
  async getItineraryPricing(id: string): Promise<PricingWithPayments> {
    const response = await client.get(`/api/v1/itineraries/${id}/pricing`);
    return response.data;
  },

  // Update itinerary pricing
  async updateItineraryPricing(id: string, data: PricingUpdate): Promise<PricingWithPayments> {
    const response = await client.put(`/api/v1/itineraries/${id}/pricing`, data);
    return response.data;
  },

  // Get all payments for an itinerary
  async getPayments(itineraryId: string): Promise<PaymentRecord[]> {
    const response = await client.get(`/api/v1/itineraries/${itineraryId}/payments`);
    return response.data;
  },

  // Create a payment
  async createPayment(itineraryId: string, data: PaymentCreate): Promise<PaymentRecord> {
    const response = await client.post(`/api/v1/itineraries/${itineraryId}/payments`, data);
    return response.data;
  },

  // Update a payment
  async updatePayment(itineraryId: string, paymentId: string, data: Partial<PaymentCreate>): Promise<PaymentRecord> {
    const response = await client.put(`/api/v1/itineraries/${itineraryId}/payments/${paymentId}`, data);
    return response.data;
  },

  // Delete a payment
  async deletePayment(itineraryId: string, paymentId: string): Promise<MessageResponse> {
    const response = await client.delete(`/api/v1/itineraries/${itineraryId}/payments/${paymentId}`);
    return response.data;
  },
};

export default itinerariesApi;
