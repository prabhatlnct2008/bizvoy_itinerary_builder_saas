import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import { AgencyCreate } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { toast } from 'react-toastify';

// Common country list
const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'India', 'Japan', 'China', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands',
  'Singapore', 'United Arab Emirates', 'South Africa', 'New Zealand', 'Other'
];

// Common timezones
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Singapore', 'Asia/Dubai', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland'
];

// Common currencies
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'AED', name: 'UAE Dirham' },
];

const AgencyForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Agency details
    name: '',
    legal_name: '',
    country: '',
    timezone: '',
    default_currency: 'USD',
    website_url: '',
    internal_notes: '',
    // Admin user details
    admin_full_name: '',
    admin_email: '',
    admin_phone: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Agency name is required';
    }
    if (!formData.admin_full_name.trim()) {
      newErrors.admin_full_name = 'Admin name is required';
    }
    if (!formData.admin_email.trim()) {
      newErrors.admin_email = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      newErrors.admin_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const agencyData: AgencyCreate = {
        name: formData.name.trim(),
        legal_name: formData.legal_name.trim() || undefined,
        country: formData.country || undefined,
        timezone: formData.timezone || undefined,
        default_currency: formData.default_currency || undefined,
        website_url: formData.website_url.trim() || undefined,
        internal_notes: formData.internal_notes.trim() || undefined,
        admin_user: {
          full_name: formData.admin_full_name.trim(),
          email: formData.admin_email.trim(),
          phone: formData.admin_phone.trim() || undefined,
        },
      };

      const created = await adminAPI.createAgency(agencyData);
      toast.success('Agency created and admin user notified by email');
      navigate(`/admin/agencies/${created.id}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        toast.error(detail);
      } else {
        toast.error('Failed to create agency');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/agencies')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Create New Agency</h1>
          <p className="mt-1 text-text-secondary">
            Create a new agency and its primary admin user
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Agency Details */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Agency Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">
                Agency Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Wanderlust Travel Agency"
                error={errors.name}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Legal Name
              </label>
              <Input
                value={formData.legal_name}
                onChange={(e) => handleInputChange('legal_name', e.target.value)}
                placeholder="e.g., Wanderlust Travel LLC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Website URL
              </label>
              <Input
                type="url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select country...</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select timezone...</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Default Currency
              </label>
              <select
                value={formData.default_currency}
                onChange={(e) => handleInputChange('default_currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">
                Internal Notes
              </label>
              <Textarea
                value={formData.internal_notes}
                onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                placeholder="Notes visible only to Bizvoy internal team..."
                rows={3}
              />
              <p className="mt-1 text-xs text-text-muted">
                Visible only to Bizvoy internal team
              </p>
            </div>
          </div>
        </Card>

        {/* Admin User */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Admin User</h2>
              <p className="text-sm text-text-secondary">
                This user will receive login credentials via email
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.admin_full_name}
                onChange={(e) => handleInputChange('admin_full_name', e.target.value)}
                placeholder="e.g., John Smith"
                error={errors.admin_full_name}
              />
              {errors.admin_full_name && (
                <p className="mt-1 text-sm text-red-500">{errors.admin_full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.admin_email}
                onChange={(e) => handleInputChange('admin_email', e.target.value)}
                placeholder="admin@agency.com"
                error={errors.admin_email}
              />
              {errors.admin_email && (
                <p className="mt-1 text-sm text-red-500">{errors.admin_email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.admin_phone}
                onChange={(e) => handleInputChange('admin_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/agencies')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Agency'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AgencyForm;
