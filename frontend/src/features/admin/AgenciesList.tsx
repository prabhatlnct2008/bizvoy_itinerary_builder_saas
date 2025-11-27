import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Eye, Edit, XCircle, CheckCircle, Building2 } from 'lucide-react';
import { adminAPI, AgencyListParams } from '../../api/admin';
import { AgencyListItem, AgencyListResponse } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Dropdown from '../../components/ui/Dropdown';
import Badge from '../../components/ui/Badge';
import { toast } from 'react-toastify';

const AgenciesList: React.FC = () => {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<AgencyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAgencies = useCallback(async () => {
    try {
      setLoading(true);
      const params: AgencyListParams = {
        page: currentPage,
        page_size: 20,
        search: search || undefined,
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
      };
      const data: AgencyListResponse = await adminAPI.listAgencies(params);
      setAgencies(data.items);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as 'all' | 'active' | 'inactive');
    setCurrentPage(1);
  };

  const handleDeactivate = async (agency: AgencyListItem) => {
    if (!confirm(`Are you sure you want to deactivate "${agency.name}"?\n\nUsers will no longer be able to log in, but their data will remain for reporting purposes.`)) {
      return;
    }

    try {
      setActionLoading(agency.id);
      await adminAPI.deactivateAgency(agency.id);
      toast.success(`Agency "${agency.name}" has been deactivated`);
      fetchAgencies();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to deactivate agency');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (agency: AgencyListItem) => {
    try {
      setActionLoading(agency.id);
      await adminAPI.reactivateAgency(agency.id);
      toast.success(`Agency "${agency.name}" has been reactivated`);
      fetchAgencies();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reactivate agency');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDropdownItems = (agency: AgencyListItem) => {
    const items = [
      {
        label: 'View Details',
        icon: <Eye className="h-4 w-4" />,
        onClick: () => navigate(`/admin/agencies/${agency.id}`),
      },
      {
        label: 'Edit',
        icon: <Edit className="h-4 w-4" />,
        onClick: () => navigate(`/admin/agencies/${agency.id}`),
      },
    ];

    if (agency.is_active) {
      items.push({
        label: 'Deactivate',
        icon: <XCircle className="h-4 w-4" />,
        onClick: () => handleDeactivate(agency),
      });
    } else {
      items.push({
        label: 'Reactivate',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: () => handleReactivate(agency),
      });
    }

    return items;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Agencies</h1>
          <p className="mt-1 text-text-secondary">Manage all agencies on the platform</p>
        </div>
        <Button onClick={() => navigate('/admin/agencies/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Agency
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="text"
                placeholder="Search by agency name or email..."
                value={search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : agencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No agencies yet</h3>
            <p className="text-text-secondary mb-4">Create your first agency to get started</p>
            <Button onClick={() => navigate('/admin/agencies/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Agency
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Agency Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Primary Contact
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Created On
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">
                    Itineraries
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">
                    Users
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((agency) => (
                  <tr
                    key={agency.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={() => navigate(`/admin/agencies/${agency.id}`)}
                        className="text-left font-medium text-primary-600 hover:text-primary-700"
                      >
                        {agency.name}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm text-text-primary">
                          {agency.primary_admin_name || '-'}
                        </p>
                        <p className="text-xs text-text-muted">
                          {agency.primary_admin_email || agency.contact_email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={agency.is_active ? 'success' : 'default'}>
                        {agency.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-sm">
                      {formatDate(agency.created_at)}
                    </td>
                    <td className="py-3 px-4 text-center text-text-secondary">
                      {agency.itinerary_count}
                    </td>
                    <td className="py-3 px-4 text-center text-text-secondary">
                      {agency.user_count}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Dropdown
                        trigger={
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            disabled={actionLoading === agency.id}
                          >
                            {actionLoading === agency.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                            ) : (
                              <MoreVertical className="h-4 w-4 text-text-secondary" />
                            )}
                          </button>
                        }
                        items={getDropdownItems(agency)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-200">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-text-secondary">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AgenciesList;
