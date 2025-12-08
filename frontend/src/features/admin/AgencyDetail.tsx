import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  FileText,
  Copy,
  Users,
  Edit,
  Save,
  X,
  XCircle,
  CheckCircle,
  ExternalLink,
  Key,
  Shield,
} from 'lucide-react';
import { adminAPI } from '../../api/admin';
import { AgencyWithStats, AgencyUpdate, AdminUser } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Badge from '../../components/ui/Badge';
import { toast } from 'react-toastify';
import ChangePasswordModal from './ChangePasswordModal';

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

const AgencyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [agency, setAgency] = useState<AgencyWithStats | null>(null);
  const [agencyUsers, setAgencyUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [formData, setFormData] = useState<AgencyUpdate>({});

  useEffect(() => {
    if (id) {
      fetchAgency();
      fetchAgencyUsers();
    }
  }, [id]);

  const fetchAgency = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAgency(id!);
      setAgency(data);
      setFormData({
        name: data.name,
        legal_name: data.legal_name,
        country: data.country,
        timezone: data.timezone,
        default_currency: data.default_currency,
        website_url: data.website_url,
        internal_notes: data.internal_notes,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load agency');
      navigate('/admin/agencies');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencyUsers = async () => {
    try {
      const users = await adminAPI.getAgencyUsers(id!);
      setAgencyUsers(users);
    } catch (err: any) {
      console.error('Failed to fetch agency users:', err);
    }
  };

  const handleInputChange = (field: keyof AgencyUpdate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminAPI.updateAgency(id!, formData);
      toast.success('Agency updated successfully');
      setEditMode(false);
      fetchAgency();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update agency');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    if (agency) {
      setFormData({
        name: agency.name,
        legal_name: agency.legal_name,
        country: agency.country,
        timezone: agency.timezone,
        default_currency: agency.default_currency,
        website_url: agency.website_url,
        internal_notes: agency.internal_notes,
        contact_email: agency.contact_email,
        contact_phone: agency.contact_phone,
      });
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Are you sure you want to deactivate "${agency?.name}"?\n\nUsers will no longer be able to log in, but their data will remain for reporting purposes.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.deactivateAgency(id!);
      toast.success('Agency deactivated');
      fetchAgency();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to deactivate agency');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      await adminAPI.reactivateAgency(id!);
      toast.success('Agency reactivated');
      fetchAgency();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reactivate agency');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenChangePasswordModal = (user: AdminUser) => {
    setSelectedUser(user);
    setChangePasswordModalOpen(true);
  };

  const handleChangePassword = async (
    userId: string,
    passwordMode: 'auto' | 'manual',
    manualPassword: string | undefined,
    sendEmail: boolean
  ): Promise<string | null> => {
    try {
      const result = await adminAPI.changePassword(id!, {
        user_id: userId,
        password_mode: passwordMode,
        manual_password: manualPassword,
        send_email: sendEmail,
      });

      if (result.success) {
        toast.success(result.message);
        return result.new_password || null;
      } else {
        toast.error(result.message);
        return result.new_password || null;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!agency) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/agencies')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-text-primary">{agency.name}</h1>
              <Badge variant={agency.is_active ? 'success' : 'default'}>
                {agency.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-1 text-text-secondary">Created {formatDate(agency.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {agency.is_active ? (
            <Button
              variant="secondary"
              onClick={handleDeactivate}
              disabled={actionLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleReactivate}
              disabled={actionLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Agency Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Agency Information</h2>
              </div>
              {!editMode ? (
                <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Agency Name
                </label>
                {editMode ? (
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                ) : (
                  <p className="text-text-primary">{agency.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Legal Name
                </label>
                {editMode ? (
                  <Input
                    value={formData.legal_name || ''}
                    onChange={(e) => handleInputChange('legal_name', e.target.value)}
                  />
                ) : (
                  <p className="text-text-primary">{agency.legal_name || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Website
                </label>
                {editMode ? (
                  <Input
                    value={formData.website_url || ''}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                  />
                ) : agency.website_url ? (
                  <a
                    href={agency.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    {agency.website_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-text-muted">-</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Country
                </label>
                {editMode ? (
                  <select
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-text-primary">{agency.country || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Timezone
                </label>
                {editMode ? (
                  <select
                    value={formData.timezone || ''}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select timezone...</option>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-text-primary">{agency.timezone || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Default Currency
                </label>
                {editMode ? (
                  <select
                    value={formData.default_currency || ''}
                    onChange={(e) => handleInputChange('default_currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-text-primary">{agency.default_currency || 'USD'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Contact Email
                </label>
                {editMode ? (
                  <Input
                    value={formData.contact_email || ''}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  />
                ) : (
                  <p className="text-text-primary">{agency.contact_email}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Internal Notes
                </label>
                {editMode ? (
                  <Textarea
                    value={formData.internal_notes || ''}
                    onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                    rows={3}
                  />
                ) : (
                  <p className="text-text-primary whitespace-pre-wrap">
                    {agency.internal_notes || '-'}
                  </p>
                )}
                <p className="mt-1 text-xs text-text-muted">
                  Visible only to Bizvoy internal team
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Admin User & Stats */}
        <div className="space-y-6">
          {/* Agency Users Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Agency Users</h2>
            </div>

            {agencyUsers.length > 0 ? (
              <div className="space-y-4">
                {agencyUsers.map((user) => {
                  const isPrimaryAdmin = agency.primary_admin?.id === user.id;
                  return (
                    <div
                      key={user.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary truncate">
                              {user.full_name}
                            </p>
                            {isPrimaryAdmin && (
                              <Badge variant="info" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                          <div className="mt-2">
                            <Badge variant={user.is_active ? 'success' : 'default'} className="text-xs">
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleOpenChangePasswordModal(user)}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-text-muted">No users found</p>
            )}
          </Card>

          {/* Usage Summary Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Usage Summary</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </div>
                <span className="font-medium text-text-primary">{agency.user_count}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <FileText className="h-4 w-4" />
                  <span>Itineraries</span>
                </div>
                <span className="font-medium text-text-primary">{agency.itinerary_count}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Copy className="h-4 w-4" />
                  <span>Templates</span>
                </div>
                <span className="font-medium text-text-primary">{agency.template_count}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => {
          setChangePasswordModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSubmit={handleChangePassword}
      />
    </div>
  );
};

export default AgencyDetail;
