import client from './client';
import {
  ShareLink,
  ShareLinkCreate,
  ShareLinkUpdate,
  PDFExport,
  PublicItineraryResponse,
} from '../types';

export const shareApi = {
  // Generate share link for itinerary
  async createShareLink(
    itineraryId: string,
    data?: ShareLinkCreate
  ): Promise<ShareLink> {
    const response = await client.post(`/api/v1/itineraries/${itineraryId}/share`, data || {});
    return response.data;
  },

  // Update share link settings
  async updateShareLink(
    linkId: string,
    data: ShareLinkUpdate
  ): Promise<ShareLink> {
    const response = await client.put(`/api/v1/itineraries/share-links/${linkId}`, data);
    return response.data;
  },

  // Export itinerary as PDF
  async exportPDF(itineraryId: string): Promise<PDFExport> {
    const response = await client.post(`/api/v1/itineraries/${itineraryId}/export-pdf`);
    return response.data;
  },

  // Download generated PDF (auth required)
  async downloadPDF(itineraryId: string, exportId: string): Promise<Blob> {
    const response = await client.get(`/api/v1/itineraries/${itineraryId}/pdf/${exportId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get public itinerary by token (no auth required)
  async getPublicItinerary(token: string): Promise<PublicItineraryResponse> {
    const response = await client.get(`/api/v1/public/itinerary/${token}`);
    return response.data;
  },
};

export default shareApi;
