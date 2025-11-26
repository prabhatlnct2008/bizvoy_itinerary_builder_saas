import client from './client';
import {
  Template,
  TemplateDetail,
  TemplateCreate,
  TemplateUpdate,
  MessageResponse,
} from '../types';

export const templatesApi = {
  // Get all templates with optional filters
  async getTemplates(params?: { status?: string }): Promise<Template[]> {
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

  // Delete template
  async deleteTemplate(id: string): Promise<MessageResponse> {
    const response = await client.delete(`/api/v1/templates/${id}`);
    return response.data;
  },
};

export default templatesApi;
