import client from './client';
import {
  Template,
  TemplateDetail,
  TemplateCreate,
  TemplateUpdate,
  TemplateListItem,
  MessageResponse,
} from '../types';

export interface TemplateListParams {
  status?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export const templatesApi = {
  // Get all templates with optional filters
  async getTemplates(params?: TemplateListParams): Promise<TemplateListItem[]> {
    const response = await client.get('/api/v1/templates', { params });
    return response.data;
  },

  // Get template by ID with full day structure
  async getTemplate(id: string): Promise<TemplateDetail> {
    const response = await client.get(`/api/v1/templates/${id}`);
    return response.data;
  },

  // Create template
  async createTemplate(data: TemplateCreate): Promise<TemplateDetail> {
    const response = await client.post('/api/v1/templates', data);
    return response.data;
  },

  // Update template
  async updateTemplate(id: string, data: TemplateUpdate): Promise<TemplateDetail> {
    const response = await client.put(`/api/v1/templates/${id}`, data);
    return response.data;
  },

  // Publish template
  async publishTemplate(id: string): Promise<Template> {
    const response = await client.post(`/api/v1/templates/${id}/publish`);
    return response.data;
  },

  // Delete template (hard delete)
  async deleteTemplate(id: string): Promise<MessageResponse> {
    const response = await client.delete(`/api/v1/templates/${id}`);
    return response.data;
  },

  // Copy/clone template
  async copyTemplate(id: string): Promise<TemplateDetail> {
    const response = await client.post(`/api/v1/templates/${id}/copy`);
    return response.data;
  },

  // Archive template (soft delete)
  async archiveTemplate(id: string): Promise<Template> {
    const response = await client.post(`/api/v1/templates/${id}/archive`);
    return response.data;
  },

  // Unarchive template
  async unarchiveTemplate(id: string): Promise<Template> {
    const response = await client.post(`/api/v1/templates/${id}/unarchive`);
    return response.data;
  },

  // Reorder days
  async reorderDays(templateId: string, dayIds: string[]): Promise<TemplateDetail> {
    const response = await client.put(`/api/v1/templates/${templateId}/days/reorder`, {
      day_ids: dayIds,
    });
    return response.data;
  },

  // Add day to template
  async addDay(templateId: string, data?: { title?: string; notes?: string }): Promise<any> {
    const response = await client.post(`/api/v1/templates/${templateId}/days`, data || {});
    return response.data;
  },

  // Delete day from template
  async deleteDay(templateId: string, dayId: string): Promise<void> {
    await client.delete(`/api/v1/templates/${templateId}/days/${dayId}`);
  },
};

export default templatesApi;
