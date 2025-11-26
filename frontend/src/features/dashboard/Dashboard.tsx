import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import dashboardApi, { DashboardOverview } from '../../api/dashboard';
import {
  Map,
  FileText,
  Sparkles,
  Eye,
  Plus,
  Copy,
  ArrowRight,
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
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-text-muted">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, recent_itineraries, recent_activities } = data;

  return (
    <div className="px-4 py-6 md:px-6 md:py-6 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-primary-600 font-semibold text-sm mb-1">Good morning, Admin 👋</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">Plan beautiful trips and track performance in one place.</h1>
            <p className="text-text-muted mt-1">Quick actions to keep you moving.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/itineraries/new')} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Itinerary
            </Button>
            <Button variant="secondary" onClick={() => navigate('/templates')} className="flex items-center gap-2">
              <Copy className="w-4 h-4" /> Browse Templates
            </Button>
            <Button variant="outline" onClick={() => navigate('/activities/new')} className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Add Activity
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Itineraries"
            value={stats.total_itineraries}
            subtitle={`Draft ${stats.draft_itineraries} · Sent ${stats.sent_itineraries} · Confirmed ${stats.confirmed_itineraries}`}
            icon={<Map className="w-5 h-5 text-primary-600" />}
            onClick={() => navigate('/itineraries')}
          />
          <KpiCard
            title="Templates"
            value={stats.total_templates}
            subtitle="Reusable playbooks"
            icon={<FileText className="w-5 h-5 text-primary-600" />}
            onClick={() => navigate('/templates')}
          />
          <KpiCard
            title="Activities"
            value={stats.total_activities}
            subtitle="Library items"
            icon={<Sparkles className="w-5 h-5 text-primary-600" />}
            onClick={() => navigate('/activities')}
          />
          <KpiCard
            title="Total Views"
            value={stats.total_views}
            subtitle={`Share Links ${stats.total_share_links}`}
            icon={<Eye className="w-5 h-5 text-primary-600" />}
          />
        </div>

        {/* Recent lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="rounded-2xl border border-border shadow-sm">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Recent Itineraries</h2>
                  <p className="text-sm text-text-muted">Latest client trips</p>
                </div>
                <button
                  onClick={() => navigate('/itineraries')}
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {recent_itineraries.length === 0 ? (
                <div className="text-center py-8">
                  <Map className="w-10 h-10 text-neutral mx-auto mb-3" />
                  <p className="text-text-muted">No itineraries yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/itineraries/new')}>
                    Create your first itinerary
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent_itineraries.map((itin) => (
                    <div
                      key={itin.id}
                      onClick={() => navigate(`/itineraries/${itin.id}`)}
                      className="p-4 bg-surface rounded-xl border border-border hover:border-primary-100 hover:shadow-sm transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-semibold text-text-primary">{itin.trip_name}</p>
                          <p className="text-sm text-text-secondary">{itin.client_name} · {itin.destination}</p>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="px-2 py-1 rounded-full bg-primary-100 text-primary-600 border border-primary-100">
                              {new Date(itin.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <StatusPill status={itin.status} />
                          {itin.total_price && (
                            <p className="text-sm font-semibold text-success">
                              ${itin.total_price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border shadow-sm">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Recent Activities</h2>
                  <p className="text-sm text-text-muted">Latest library entries</p>
                </div>
                <button
                  onClick={() => navigate('/activities')}
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {recent_activities.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-10 h-10 text-neutral mx-auto mb-3" />
                  <p className="text-text-muted">No activities yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/activities/new')}>
                    Add your first activity
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent_activities.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => navigate(`/activities/${act.id}`)}
                      className="p-4 bg-surface rounded-xl border border-border hover:border-primary-100 hover:shadow-sm transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-semibold text-text-primary">{act.name}</p>
                          <p className="text-sm text-text-secondary">
                            {act.category_label || 'Uncategorized'} · {act.location_display || 'Location TBD'}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-primary-100 text-primary-600 text-xs border border-primary-100">
                          {act.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const KpiCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition cursor-pointer"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
        {icon}
      </div>
      <ArrowRight className="w-4 h-4 text-text-muted" />
    </div>
    <div className="space-y-1">
      <p className="text-sm text-text-muted">{title}</p>
      <p className="text-3xl font-semibold text-text-primary">{value}</p>
      {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
    </div>
  </div>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-primary-100 text-primary-600',
    confirmed: 'bg-green-100 text-success',
    completed: 'bg-green-100 text-success',
    cancelled: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

export default Dashboard;
