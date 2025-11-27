import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, FileText, TrendingUp, ExternalLink } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import { AdminDashboardStats, TopAgency } from '../../types';
import Card from '../../components/ui/Card';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, subtitle, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDashboard();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Bizvoy Admin Dashboard</h1>
        <p className="mt-1 text-text-secondary">Platform overview and agency management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Agencies"
          value={stats?.total_agencies || 0}
          icon={<Building2 className="h-6 w-6" />}
          color="primary"
        />
        <StatsCard
          title="Active Agencies"
          value={stats?.active_agencies || 0}
          icon={<Building2 className="h-6 w-6" />}
          subtitle={`${stats?.inactive_agencies || 0} inactive`}
          color="green"
        />
        <StatsCard
          title="Total Itineraries"
          value={stats?.total_itineraries || 0}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="Itineraries (30 days)"
          value={stats?.itineraries_last_30_days || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Total Templates"
          value={stats?.total_templates || 0}
          icon={<FileText className="h-6 w-6" />}
          color="primary"
        />
        <StatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
      </div>

      {/* Top Agencies */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Top Agencies by Usage</h2>
          <button
            onClick={() => navigate('/admin/agencies')}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View all agencies
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {stats?.top_agencies && stats.top_agencies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Agency Name
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                    Itineraries
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.top_agencies.map((agency: TopAgency) => (
                  <tr
                    key={agency.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/admin/agencies/${agency.id}`)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-text-primary">{agency.name}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-text-secondary">
                      {agency.itinerary_count}
                    </td>
                    <td className="py-3 px-4 text-right text-text-muted">
                      {formatDate(agency.last_activity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">
            No agencies found. Create your first agency to get started.
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
