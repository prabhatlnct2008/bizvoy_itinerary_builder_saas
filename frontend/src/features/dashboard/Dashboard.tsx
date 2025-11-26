import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import itinerariesApi from '../../api/itineraries';
import templatesApi from '../../api/templates';
import { Itinerary, Template } from '../../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItineraries: 0,
    upcomingTrips: 0,
    activeTemplates: 0,
  });
  const [recentItineraries, setRecentItineraries] = useState<Itinerary[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch itineraries
      const itineraries = await itinerariesApi.getItineraries();
      const templates = await templatesApi.getTemplates({ status: 'published' });

      // Calculate stats
      const now = new Date();
      const upcomingTrips = itineraries.filter(
        (itin) =>
          new Date(itin.start_date) > now &&
          (itin.status === 'confirmed' || itin.status === 'sent')
      ).length;

      setStats({
        totalItineraries: itineraries.length,
        upcomingTrips,
        activeTemplates: templates.length,
      });

      // Get recent items
      setRecentItineraries(itineraries.slice(0, 5));
      setRecentTemplates(templates.slice(0, 5));
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-secondary mt-2">Welcome to your travel agency workspace</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Button
          size="lg"
          onClick={() => navigate('/itineraries/new')}
          className="mr-4"
        >
          + Create New Itinerary
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => navigate('/templates')}
        >
          Browse Templates
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total Itineraries</p>
                <p className="text-3xl font-bold text-primary">{stats.totalItineraries}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Upcoming Trips</p>
                <p className="text-3xl font-bold text-secondary-500">{stats.upcomingTrips}</p>
              </div>
              <div className="p-3 bg-secondary-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-secondary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Active Templates</p>
                <p className="text-3xl font-bold text-primary">{stats.activeTemplates}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Itineraries */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-primary">Recent Itineraries</h2>
              <button
                onClick={() => navigate('/itineraries')}
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                View all →
              </button>
            </div>

            {recentItineraries.length === 0 ? (
              <p className="text-muted text-center py-8">No itineraries yet</p>
            ) : (
              <div className="space-y-3">
                {recentItineraries.map((itin) => (
                  <div
                    key={itin.id}
                    onClick={() => navigate(`/itineraries/${itin.id}`)}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-primary">{itin.trip_name}</p>
                      <Chip
                        label={itin.status}
                        variant={
                          itin.status === 'confirmed'
                            ? 'success'
                            : itin.status === 'draft'
                            ? 'default'
                            : 'primary'
                        }
                        size="sm"
                      />
                    </div>
                    <p className="text-sm text-secondary">{itin.client_name}</p>
                    <p className="text-xs text-muted mt-1">
                      {new Date(itin.start_date).toLocaleDateString()} - {itin.destination}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Templates */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-primary">Active Templates</h2>
              <button
                onClick={() => navigate('/templates')}
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                View all →
              </button>
            </div>

            {recentTemplates.length === 0 ? (
              <p className="text-muted text-center py-8">No templates yet</p>
            ) : (
              <div className="space-y-3">
                {recentTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => navigate(`/templates/${template.id}`)}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <p className="font-medium text-primary mb-2">{template.name}</p>
                    <p className="text-sm text-secondary">{template.destination}</p>
                    <p className="text-xs text-muted mt-1">
                      {template.duration_nights}N / {template.duration_days}D
                      {template.approximate_price && ` · $${template.approximate_price}`}
                    </p>
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

export default Dashboard;
