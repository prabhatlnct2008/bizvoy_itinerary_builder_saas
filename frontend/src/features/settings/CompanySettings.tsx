import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import companyProfileApi, { CompanyProfileResponse, CompanyProfileUpdate } from '../../api/companyProfile';
import {
  Upload,
  Eye,
  EyeOff,
  QrCode,
  Save,
} from 'lucide-react';

const CompanySettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<CompanyProfileResponse | null>(null);

  const [formData, setFormData] = useState<CompanyProfileUpdate>({
    company_name: '',
    tagline: '',
    description: '',
    email: '',
    phone: '',
    website_url: '',
    whatsapp_number: '',
    show_phone: true,
    show_email: true,
    show_website: true,
    payment_note: '',
    bank_account_name: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_swift: '',
    bank_reference_note: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await companyProfileApi.getProfile();
      setProfile(data);
      setFormData({
        company_name: data.company_name || '',
        tagline: data.tagline || '',
        description: data.description || '',
        email: data.email || '',
        phone: data.phone || '',
        website_url: data.website_url || '',
        whatsapp_number: data.whatsapp_number || '',
        show_phone: data.show_phone ?? true,
        show_email: data.show_email ?? true,
        show_website: data.show_website ?? true,
        payment_note: data.payment_note || '',
        bank_account_name: data.bank_account_name || '',
        bank_name: data.bank_name || '',
        bank_account_number: data.bank_account_number || '',
        bank_ifsc_swift: data.bank_ifsc_swift || '',
        bank_reference_note: data.bank_reference_note || '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load company profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updated = await companyProfileApi.uploadLogo(file);
      setProfile(updated);
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload logo');
    }
  };

  const handlePaymentQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updated = await companyProfileApi.uploadPaymentQR(file);
      setProfile(updated);
      toast.success('Payment QR uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload payment QR');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const updated = await companyProfileApi.updateProfile(formData);
      setProfile(updated);
      toast.success('Company profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Company Settings</h1>
        <p className="text-sm text-slate-500">Configure your company profile for shared itineraries.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Branding Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Branding</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo Upload */}
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                Company Logo
              </label>
              <div className="flex items-center gap-4">
                {profile?.logo_url ? (
                  <img
                    src={`${baseUrl}${profile.logo_url}`}
                    alt="Company Logo"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                    <span className="text-slate-400 text-xs">Logo</span>
                  </div>
                )}
                <div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-700 text-sm px-3 py-2 rounded-lg hover:bg-slate-50">
                      <Upload className="w-4 h-4" />
                      Upload
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-400 mt-1">200x200px, PNG or JPG</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                Company Name
              </label>
              <input
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Your Company Name"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                Tagline
              </label>
              <input
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Your Travel Partner"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell clients about your company..."
                rows={3}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@yourcompany.com"
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, show_email: !formData.show_email })}
                  className={`px-3 py-2 rounded-lg border ${formData.show_email ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  title={formData.show_email ? 'Visible' : 'Hidden'}
                >
                  {formData.show_email ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                Phone
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, show_phone: !formData.show_phone })}
                  className={`px-3 py-2 rounded-lg border ${formData.show_phone ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  title={formData.show_phone ? 'Visible' : 'Hidden'}
                >
                  {formData.show_phone ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                Website
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.website_url || ''}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://yourcompany.com"
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, show_website: !formData.show_website })}
                  className={`px-3 py-2 rounded-lg border ${formData.show_website ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  title={formData.show_website ? 'Visible' : 'Hidden'}
                >
                  {formData.show_website ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formData.whatsapp_number || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Payment Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment QR Upload */}
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                Payment QR Code
              </label>
              <div className="flex items-center gap-4">
                {profile?.payment_qr_url ? (
                  <img
                    src={`${baseUrl}${profile.payment_qr_url}`}
                    alt="Payment QR"
                    className="w-24 h-24 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                    <QrCode className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-700 text-sm px-3 py-2 rounded-lg hover:bg-slate-50">
                      <Upload className="w-4 h-4" />
                      Upload QR
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handlePaymentQRUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-400 mt-1">UPI, PayPal, etc.</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 uppercase tracking-[0.08em] mb-2">
                Payment Note
              </label>
              <input
                value={formData.payment_note || ''}
                onChange={(e) => setFormData({ ...formData, payment_note: e.target.value })}
                placeholder="Secure payment powered by Stripe"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
              <h3 className="text-xs text-slate-500 uppercase tracking-[0.08em] mb-4">Bank Account Details (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Account Name</label>
                  <input
                    value={formData.bank_account_name || ''}
                    onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                    placeholder="Your Company Name"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Bank Name</label>
                  <input
                    value={formData.bank_name || ''}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="Bank of America"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Account Number</label>
                  <input
                    value={formData.bank_account_number || ''}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">IFSC/SWIFT Code</label>
                  <input
                    value={formData.bank_ifsc_swift || ''}
                    onChange={(e) => setFormData({ ...formData, bank_ifsc_swift: e.target.value })}
                    placeholder="ABCD0001234"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Reference Note</label>
                  <input
                    value={formData.bank_reference_note || ''}
                    onChange={(e) => setFormData({ ...formData, bank_reference_note: e.target.value })}
                    placeholder="Please include your booking ID as reference"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;
