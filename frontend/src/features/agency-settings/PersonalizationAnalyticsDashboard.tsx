import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../../components/ui/Card';
import { getAgencyAnalytics } from '../../api/gamification';

interface AgencyAnalytics {
  total_sessions: number;
  completion_rate: number;
  confirmation_rate: number;
  total_revenue_added: number;
  sessions_over_time: Array<{ date: string; count: number }>;
  top_performing_activities: Array<{
    id: string;
    name: string;
    like_count: number;
    pass_count: number;
  }>;
  vibe_distribution: { [key: string]: number };
}

const PersonalizationAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AgencyAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAgencyAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const mostLiked = analytics.top_performing_activities
    .sort((a, b) => b.like_count - a.like_count)
    .slice(0, 5);

  const mostPassed = analytics.top_performing_activities
    .sort((a, b) => b.pass_count - a.pass_count)
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Personalization Analytics
          </h1>
          <p className="text-text-secondary">
            Track performance of your gamified discovery engine
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-text-secondary" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="text-sm text-text-secondary mb-1">Total Sessions</div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            {analytics.total_sessions.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            {getTrendIcon(5)}
            <span>+5% vs last period</span>
          </div>
        </Card>

        <Card>
          <div className="text-sm text-text-secondary mb-1">Completion Rate</div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            {Math.round(analytics.completion_rate)}%
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            {getTrendIcon(2)}
            <span>+2% vs last period</span>
          </div>
        </Card>

        <Card>
          <div className="text-sm text-text-secondary mb-1">Confirmation Rate</div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            {Math.round(analytics.confirmation_rate)}%
          </div>
          <div className="flex items-center gap-1 text-sm text-red-600">
            {getTrendIcon(-1)}
            <span>-1% vs last period</span>
          </div>
        </Card>

        <Card>
          <div className="text-sm text-text-secondary mb-1">Revenue Added</div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            {formatCurrency(analytics.total_revenue_added)}
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            {getTrendIcon(12)}
            <span>+12% vs last period</span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sessions Over Time */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Sessions Over Time
          </h3>
          <div className="space-y-2">
            {analytics.sessions_over_time.slice(0, 10).map((item, index) => {
              const maxCount = Math.max(
                ...analytics.sessions_over_time.map((i) => i.count)
              );
              const percentage = (item.count / maxCount) * 100;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-xs text-text-muted w-20">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-primary-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2 text-xs font-medium">
                      {item.count} sessions
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Vibe Popularity */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Vibe Popularity
          </h3>
          <div className="space-y-2">
            {Object.entries(analytics.vibe_distribution)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([vibe, count], index) => {
                const maxCount = Math.max(...Object.values(analytics.vibe_distribution));
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-sm text-text-primary w-24 capitalize">
                      {vibe.replace('_', ' ')}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-2 text-xs font-medium">
                        {count} selections
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Activity Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Liked Activities */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Most Liked Activities
          </h3>
          {mostLiked.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No data available yet
            </div>
          ) : (
            <div className="space-y-3">
              {mostLiked.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 font-bold rounded-full text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-primary text-sm">
                      {activity.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text-primary">
                      {activity.like_count}
                    </div>
                    <div className="text-xs text-text-muted">likes</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Most Passed Activities */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Most Passed Activities
          </h3>
          {mostPassed.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No data available yet
            </div>
          ) : (
            <div className="space-y-3">
              {mostPassed.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-700 font-bold rounded-full text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-primary text-sm">
                      {activity.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text-primary">
                      {activity.pass_count}
                    </div>
                    <div className="text-xs text-text-muted">passes</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PersonalizationAnalyticsDashboard;
