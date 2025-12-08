/**
 * Bizvoy Admin API - Agency Management
 */

import apiClient from './client';
import {
  AdminDashboardStats,
  AgencyListResponse,
  AgencyWithStats,
  AgencyCreate,
  AgencyUpdate,
  AgencyStatusChange,
  ResendInvitationRequest,
  ResendInvitationResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  AdminUser,
} from '../types';

const API_PREFIX = '/api/v1/admin';

export interface AgencyListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status_filter?: 'active' | 'inactive' | 'all';
}

export const adminAPI = {
  /**
   * Get admin dashboard statistics
   */
  getDashboard: async (): Promise<AdminDashboardStats> => {
    const response = await apiClient.get<AdminDashboardStats>(`${API_PREFIX}/dashboard`);
    return response.data;
  },

  /**
   * List all agencies with pagination and filters
   */
  listAgencies: async (params: AgencyListParams = {}): Promise<AgencyListResponse> => {
    const response = await apiClient.get<AgencyListResponse>(`${API_PREFIX}/agencies`, {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 20,
        search: params.search || undefined,
        status_filter: params.status_filter || undefined,
      },
    });
    return response.data;
  },

  /**
   * Get single agency details
   */
  getAgency: async (agencyId: string): Promise<AgencyWithStats> => {
    const response = await apiClient.get<AgencyWithStats>(`${API_PREFIX}/agencies/${agencyId}`);
    return response.data;
  },

  /**
   * Create a new agency with admin user
   */
  createAgency: async (data: AgencyCreate): Promise<AgencyWithStats> => {
    const response = await apiClient.post<AgencyWithStats>(`${API_PREFIX}/agencies`, data);
    return response.data;
  },

  /**
   * Update agency details
   */
  updateAgency: async (agencyId: string, data: AgencyUpdate): Promise<AgencyWithStats> => {
    const response = await apiClient.put<AgencyWithStats>(`${API_PREFIX}/agencies/${agencyId}`, data);
    return response.data;
  },

  /**
   * Deactivate an agency (soft delete)
   */
  deactivateAgency: async (agencyId: string): Promise<AgencyStatusChange> => {
    const response = await apiClient.post<AgencyStatusChange>(
      `${API_PREFIX}/agencies/${agencyId}/deactivate`
    );
    return response.data;
  },

  /**
   * Reactivate an inactive agency
   */
  reactivateAgency: async (agencyId: string): Promise<AgencyStatusChange> => {
    const response = await apiClient.post<AgencyStatusChange>(
      `${API_PREFIX}/agencies/${agencyId}/reactivate`
    );
    return response.data;
  },

  /**
   * Resend invitation email to agency admin
   */
  resendInvitation: async (
    agencyId: string,
    data: ResendInvitationRequest
  ): Promise<ResendInvitationResponse> => {
    const response = await apiClient.post<ResendInvitationResponse>(
      `${API_PREFIX}/agencies/${agencyId}/resend-invitation`,
      data
    );
    return response.data;
  },

  /**
   * Get all users for an agency
   */
  getAgencyUsers: async (agencyId: string): Promise<AdminUser[]> => {
    const response = await apiClient.get<AdminUser[]>(`${API_PREFIX}/agencies/${agencyId}/users`);
    return response.data;
  },

  /**
   * Change user password with auto/manual generation and optional email
   */
  changePassword: async (
    agencyId: string,
    data: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> => {
    const response = await apiClient.post<ChangePasswordResponse>(
      `${API_PREFIX}/agencies/${agencyId}/change-password`,
      data
    );
    return response.data;
  },
};

export default adminAPI;
