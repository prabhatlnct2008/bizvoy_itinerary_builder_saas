import client from './client';

export interface CompanyProfileResponse {
  id: string;
  agency_id: string;
  company_name: string | null;
  tagline: string | null;
  description: string | null;
  logo_path: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  whatsapp_number: string | null;
  show_phone: boolean;
  show_email: boolean;
  show_website: boolean;
  payment_qr_path: string | null;
  payment_qr_url: string | null;
  payment_note: string | null;
  bank_account_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc_swift: string | null;
  bank_reference_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyProfileUpdate {
  company_name?: string | null;
  tagline?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website_url?: string | null;
  whatsapp_number?: string | null;
  show_phone?: boolean;
  show_email?: boolean;
  show_website?: boolean;
  payment_note?: string | null;
  bank_account_name?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc_swift?: string | null;
  bank_reference_note?: string | null;
}

const companyProfileApi = {
  getProfile: async (): Promise<CompanyProfileResponse> => {
    const response = await client.get('/api/v1/company-profile');
    return response.data;
  },

  updateProfile: async (data: CompanyProfileUpdate): Promise<CompanyProfileResponse> => {
    const response = await client.put('/api/v1/company-profile', data);
    return response.data;
  },

  uploadLogo: async (file: File): Promise<CompanyProfileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/api/v1/company-profile/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadPaymentQR: async (file: File): Promise<CompanyProfileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/api/v1/company-profile/payment-qr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default companyProfileApi;
