import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import dashboardApi, { DashboardOverview } from '../../api/dashboard';
import { Map, Sparkles } from 'lucide-react';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-sm text-slate-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, recent_itineraries, recent_activities } = data;

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Welcome to your travel agency workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/itineraries/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            Create itinerary
          </button>
          <button
            onClick={() => navigate('/templates')}
            className="border border-slate-300 bg-white text-slate-700 text-sm px-3 py-2 rounded-lg hover:bg-slate-50"
          >
            Browse templates
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Total itineraries</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total_itineraries}</p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.draft_itineraries} drafts · {stats.sent_itineraries} sent · {stats.confirmed_itineraries} confirmed
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Templates</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total_templates}</p>
          <p className="mt-1 text-xs text-slate-400">Reusable trip templates</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Activities</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total_activities}</p>
          <p className="mt-1 text-xs text-slate-400">In your library</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Total views</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total_views}</p>
          <p className="mt-1 text-xs text-slate-400">{stats.total_share_links} share links</p>
        </div>
      </div>

      {/* Recent lists */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Itineraries */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent itineraries</h2>
            <button
              onClick={() => navigate('/itineraries')}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>

          {recent_itineraries.length === 0 ? (
            <div className="text-center py-8">
              <Map className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No itineraries yet</p>
              <button
                onClick={() => navigate('/itineraries/new')}
                className="mt-3 text-xs text-blue-600 hover:text-blue-700"
              >
                Create your first itinerary
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recent_itineraries.slice(0, 5).map((itin) => (
                <div
                  key={itin.id}
                  onClick={() => navigate(`/itineraries/${itin.id}`)}
                  className="p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-slate-900">{itin.trip_name}</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusColors[itin.status] || 'bg-slate-100 text-slate-700'}`}>
                      {itin.status.charAt(0).toUpperCase() + itin.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{itin.client_name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(itin.start_date).toLocaleDateString()} · {itin.destination}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent activities</h2>
            <button
              onClick={() => navigate('/activities')}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>

          {recent_activities.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No activities yet</p>
              <button
                onClick={() => navigate('/activities/new')}
                className="mt-3 text-xs text-blue-600 hover:text-blue-700"
              >
                Add your first activity
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recent_activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => navigate(`/activities/${activity.id}`)}
                  className="p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-slate-900">{activity.name}</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${activity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {activity.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {activity.category_label && (
                    <p className="text-xs text-slate-500 capitalize">{activity.category_label}</p>
                  )}
                  {activity.location_display && (
                    <p className="text-xs text-slate-400 mt-1">{activity.location_display}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
