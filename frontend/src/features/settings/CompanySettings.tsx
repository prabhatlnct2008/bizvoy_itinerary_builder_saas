import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import companyProfileApi, { CompanyProfileResponse, CompanyProfileUpdate } from '../../api/companyProfile';
import {
  Building,
  Upload,
  Mail,
  Phone,
  Globe,
  CreditCard,
  Eye,
  EyeOff,
  Trash2,
  QrCode,
  Save,
  Loader2
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <Building className="w-7 h-7 text-primary-600" />
            Company Settings
          </h1>
          <p className="text-gray-500 mt-1">
            Configure your company profile for shared itineraries
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Branding Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
              Branding
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex items-center gap-6">
                  {profile?.logo_url ? (
                    <img
                      src={`${baseUrl}${profile.logo_url}`}
                      alt="Company Logo"
                      className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
                      <Building className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended: 200x200px, PNG or JPG
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <Input
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline
                </label>
                <Input
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Your Travel Partner"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description
                </label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell clients about your company... (2-4 sentences)"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@yourcompany.com"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, show_email: !formData.show_email })}
                    className={`px-3 py-2 rounded-lg border ${formData.show_email ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                    title={formData.show_email ? 'Visible on shared pages' : 'Hidden on shared pages'}
                  >
                    {formData.show_email ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone
                </label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, show_phone: !formData.show_phone })}
                    className={`px-3 py-2 rounded-lg border ${formData.show_phone ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                    title={formData.show_phone ? 'Visible on shared pages' : 'Hidden on shared pages'}
                  >
                    {formData.show_phone ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="inline w-4 h-4 mr-1" />
                  Website
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={formData.website_url || ''}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://yourcompany.com"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, show_website: !formData.show_website })}
                    className={`px-3 py-2 rounded-lg border ${formData.show_website ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                    title={formData.show_website ? 'Visible on shared pages' : 'Hidden on shared pages'}
                  >
                    {formData.show_website ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <Input
                  type="tel"
                  value={formData.whatsapp_number || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
              Payment Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment QR Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <QrCode className="inline w-4 h-4 mr-1" />
                  Payment QR Code
                </label>
                <div className="flex items-center gap-6">
                  {profile?.payment_qr_url ? (
                    <img
                      src={`${baseUrl}${profile.payment_qr_url}`}
                      alt="Payment QR"
                      className="w-32 h-32 rounded-xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
                      <QrCode className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Upload className="w-4 h-4" />
                        Upload QR Code
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handlePaymentQRUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Upload your payment QR code (UPI, PayPal, etc.)
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Note
                </label>
                <Input
                  value={formData.payment_note || ''}
                  onChange={(e) => setFormData({ ...formData, payment_note: e.target.value })}
                  placeholder="Secure payment powered by Stripe"
                />
              </div>

              <div className="md:col-span-2 border-t pt-6 mt-2">
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Bank Account Details (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Account Name</label>
                    <Input
                      value={formData.bank_account_name || ''}
                      onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Bank Name</label>
                    <Input
                      value={formData.bank_name || ''}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="Bank of America"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Account Number</label>
                    <Input
                      value={formData.bank_account_number || ''}
                      onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                      placeholder="XXXX XXXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">IFSC/SWIFT Code</label>
                    <Input
                      value={formData.bank_ifsc_swift || ''}
                      onChange={(e) => setFormData({ ...formData, bank_ifsc_swift: e.target.value })}
                      placeholder="ABCD0001234"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Reference Note</label>
                    <Input
                      value={formData.bank_reference_note || ''}
                      onChange={(e) => setFormData({ ...formData, bank_reference_note: e.target.value })}
                      placeholder="Please include your booking ID as reference"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettings;
