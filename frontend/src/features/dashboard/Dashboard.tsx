import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import dashboardApi, { DashboardOverview, DashboardStats } from '../../api/dashboard';
import {
  Map,
  FileText,
  Sparkles,
  Link2,
  Eye,
  Plus,
  Copy,
  ArrowRight,
  TrendingUp,
  Send,
  CheckCircle,
  Clock
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const dashboardData = await dashboardApi.getStats();
      setData(dashboardData);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, recent_itineraries, recent_activities } = data;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-600',
    confirmed: 'bg-green-100 text-green-600',
    completed: 'bg-purple-100 text-purple-600',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome to your travel agency workspace</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Button
          onClick={() => navigate('/itineraries/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Itinerary
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/templates')}
          className="flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Browse Templates
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/activities/new')}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Add Activity
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Itineraries"
          value={stats.total_itineraries}
          icon={<Map className="w-6 h-6" />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          onClick={() => navigate('/itineraries')}
        />
        <StatsCard
          title="Templates"
          value={stats.total_templates}
          icon={<FileText className="w-6 h-6" />}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          onClick={() => navigate('/templates')}
        />
        <StatsCard
          title="Activities"
          value={stats.total_activities}
          icon={<Sparkles className="w-6 h-6" />}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          onClick={() => navigate('/activities')}
        />
        <StatsCard
          title="Total Views"
          value={stats.total_views}
          icon={<Eye className="w-6 h-6" />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          subtitle={`${stats.total_share_links} share links`}
        />
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Draft</span>
          </div>
          <p className="text-2xl font-bold text-gray-700">{stats.draft_itineraries}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-500">Sent</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.sent_itineraries}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">Confirmed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.confirmed_itineraries}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-500">Share Links</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.total_share_links}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-500">Page Views</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.total_views}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Itineraries */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Itineraries</h2>
              <button
                onClick={() => navigate('/itineraries')}
                className="text-sm text-primary-600 hover:text-primary-500 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {recent_itineraries.length === 0 ? (
              <div className="text-center py-8">
                <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No itineraries yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/itineraries/new')}
                >
                  Create your first itinerary
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recent_itineraries.map((itin) => (
                  <div
                    key={itin.id}
                    onClick={() => navigate(`/itineraries/${itin.id}`)}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900">{itin.trip_name}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[itin.status] || 'bg-gray-100 text-gray-600'}`}>
                        {itin.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{itin.client_name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {new Date(itin.start_date).toLocaleDateString()} - {itin.destination}
                      </p>
                      {itin.total_price && (
                        <p className="text-sm font-medium text-green-600">
                          ${itin.total_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activities */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
              <button
                onClick={() => navigate('/activities')}
                className="text-sm text-primary-600 hover:text-primary-500 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {recent_activities.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No activities yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/activities/new')}
                >
                  Add your first activity
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recent_activities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => navigate(`/activities/${activity.id}`)}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900">{activity.name}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${activity.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {activity.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {activity.category_label && (
                      <p className="text-sm text-gray-600 capitalize">{activity.category_label}</p>
                    )}
                    {activity.location_display && (
                      <p className="text-xs text-gray-400 mt-1">{activity.location_display}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  subtitle,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
