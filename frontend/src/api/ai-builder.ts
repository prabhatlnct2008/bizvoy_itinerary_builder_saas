/**
 * AI Itinerary Builder API Client
 */

import apiClient from './client';

const API_PREFIX = '/api/v1/ai-builder';

// Types
export interface AIBuilderStatusResponse {
  enabled: boolean;
  agency_id: string;
  agency_name: string;
}

export interface AIBuilderSessionCreate {
  destination?: string;
  trip_title?: string;
  num_days?: number;
  raw_content: string;
}

export interface AIBuilderSessionResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  current_step: number;
  error_message?: string;
  destination?: string;
  trip_title?: string;
  num_days?: number;
  detected_days?: number;
  parsed_summary?: {
    stays?: number;
    meals?: number;
    experiences?: number;
    transfers?: number;
  };
  activities_created: number;
  activities_reused: number;
  template_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface DraftActivityResponse {
  id: string;
  day_number: number;
  order_index: number;
  day_title?: string;
  name: string;
  activity_type_id?: string;
  activity_type_label?: string;
  location_display?: string;
  short_description?: string;
  default_duration_value?: number;
  default_duration_unit?: string;
  estimated_price?: number;
  currency_code: string;
  matched_activity_id?: string;
  matched_activity_name?: string;
  match_score?: number;
  decision: 'pending' | 'create_new' | 'reuse_existing';
  created_at: string;
  updated_at: string;
}

export interface DraftActivityUpdate {
  name?: string;
  activity_type_id?: string;
  location_display?: string;
  short_description?: string;
  default_duration_value?: number;
  default_duration_unit?: string;
  estimated_price?: number;
}

export interface DraftDecision {
  decision: 'create_new' | 'reuse_existing';
  reuse_activity_id?: string;
}

export interface BulkDecision {
  action: 'accept_all_new' | 'auto_reuse_best' | 'clear_all';
  match_threshold?: number;
}

export interface BulkDecisionResponse {
  updated_count: number;
  new_count: number;
  reuse_count: number;
}

export interface DayGroup {
  day_number: number;
  day_title?: string;
  activity_count: number;
}

export interface DraftActivitiesWithDays {
  days: DayGroup[];
  activities: DraftActivityResponse[];
  total_activities: number;
  total_new: number;
  total_reuse: number;
  total_pending: number;
}

export interface NextStepItem {
  type: 'missing_images' | 'estimated_prices' | 'fine_tune';
  title: string;
  detail: string;
  count?: number;
  action_url?: string;
}

export interface TemplateCreationResponse {
  template_id: string;
  template_name: string;
  destination?: string;
  num_days: number;
  activities_created: number;
  activities_reused: number;
  next_steps: NextStepItem[];
}

export const aiBuilderAPI = {
  /**
   * Check if AI builder is enabled for current user's agency
   */
  getStatus: async (): Promise<AIBuilderStatusResponse> => {
    const response = await apiClient.get<AIBuilderStatusResponse>(`${API_PREFIX}/status`);
    return response.data;
  },

  /**
   * Create a new AI builder session
   */
  createSession: async (data: AIBuilderSessionCreate): Promise<AIBuilderSessionResponse> => {
    const response = await apiClient.post<AIBuilderSessionResponse>(`${API_PREFIX}/sessions`, data);
    return response.data;
  },

  /**
   * Get session status and details
   */
  getSession: async (sessionId: string): Promise<AIBuilderSessionResponse> => {
    const response = await apiClient.get<AIBuilderSessionResponse>(`${API_PREFIX}/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Get draft activities for review
   */
  getDraftActivities: async (sessionId: string, dayFilter?: number): Promise<DraftActivitiesWithDays> => {
    const params = dayFilter !== undefined ? { day_filter: dayFilter } : {};
    const response = await apiClient.get<DraftActivitiesWithDays>(
      `${API_PREFIX}/sessions/${sessionId}/draft-activities`,
      { params }
    );
    return response.data;
  },

  /**
   * Update a draft activity
   */
  updateDraftActivity: async (
    sessionId: string,
    activityId: string,
    data: DraftActivityUpdate
  ): Promise<DraftActivityResponse> => {
    const response = await apiClient.patch<DraftActivityResponse>(
      `${API_PREFIX}/sessions/${sessionId}/draft-activities/${activityId}`,
      data
    );
    return response.data;
  },

  /**
   * Set decision for a draft activity
   */
  setDecision: async (
    sessionId: string,
    activityId: string,
    data: DraftDecision
  ): Promise<DraftActivityResponse> => {
    const response = await apiClient.post<DraftActivityResponse>(
      `${API_PREFIX}/sessions/${sessionId}/draft-activities/${activityId}/decision`,
      data
    );
    return response.data;
  },

  /**
   * Apply bulk decision to draft activities
   */
  bulkDecision: async (sessionId: string, data: BulkDecision): Promise<BulkDecisionResponse> => {
    const response = await apiClient.post<BulkDecisionResponse>(
      `${API_PREFIX}/sessions/${sessionId}/bulk-decision`,
      data
    );
    return response.data;
  },

  /**
   * Create template from session
   */
  createTemplate: async (
    sessionId: string,
    templateName?: string
  ): Promise<TemplateCreationResponse> => {
    const response = await apiClient.post<TemplateCreationResponse>(
      `${API_PREFIX}/sessions/${sessionId}/create-template`,
      { template_name: templateName }
    );
    return response.data;
  },
};

export default aiBuilderAPI;
