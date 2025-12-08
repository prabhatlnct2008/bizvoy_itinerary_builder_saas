import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, DollarSign, Tag, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getGamificationStatus } from '../../api/gamification';

interface ReadinessStatus {
  total_activities: number;
  game_ready_count: number;
  game_ready_percentage: number;
  issues: {
    missing_hero_image: number;
    missing_price: number;
    missing_vibe_tags: number;
    missing_description: number;
    missing_location: number;
  };
}

const ReadinessOverview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ReadinessStatus | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await getGamificationStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load readiness status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading readiness data...</div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const percentage = status.game_ready_percentage;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColorClass = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrokeColor = (percentage: number) => {
    if (percentage >= 70) return '#16a34a';
    if (percentage >= 40) return '#ca8a04';
    return '#dc2626';
  };

  const issuesList = [
    {
      icon: Image,
      label: 'Missing hero image',
      count: status.issues.missing_hero_image,
      filter: 'no-hero-image',
    },
    {
      icon: DollarSign,
      label: 'Missing price',
      count: status.issues.missing_price,
      filter: 'no-price',
    },
    {
      icon: Tag,
      label: 'Missing vibe tags',
      count: status.issues.missing_vibe_tags,
      filter: 'no-vibes',
    },
  ];

  const topIssues = issuesList
    .filter((issue) => issue.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Activity Readiness
        </h1>
        <p className="text-text-secondary">
          Track how many activities are optimized for the discovery engine
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Ring */}
        <Card className="flex flex-col items-center justify-center p-8">
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke={getStrokeColor(percentage)}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${getColorClass(percentage)}`}>
                {Math.round(percentage)}%
              </div>
              <div className="text-sm text-text-secondary mt-1">Game Ready</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold text-text-primary mb-1">
              {status.game_ready_count} / {status.total_activities}
            </div>
            <div className="text-sm text-text-secondary">Activities optimized</div>
          </div>

          {percentage < 80 && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Get to 80% for best results
              </div>
            </div>
          )}

          {percentage >= 80 && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Great job! Your activities are ready
              </div>
            </div>
          )}
        </Card>

        {/* Top Issues */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Top Issues to Fix
          </h3>

          {topIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-3" />
              <div className="text-lg font-medium text-text-primary mb-1">
                All activities are ready!
              </div>
              <div className="text-sm text-text-secondary">
                No issues found with your activities
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {topIssues.map((issue, index) => {
                const Icon = issue.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Icon className="w-5 h-5 text-text-secondary" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">
                          {issue.count} {issue.count === 1 ? 'activity' : 'activities'}
                        </div>
                        <div className="text-sm text-text-secondary">{issue.label}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/activities?filter=${issue.filter}`)}
                      className="flex items-center gap-2"
                    >
                      Quick Fix
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {topIssues.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/activities')}
              >
                View All Activities
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="text-center">
          <div className="text-3xl font-bold text-text-primary mb-2">
            {status.total_activities}
          </div>
          <div className="text-sm text-text-secondary">Total Activities</div>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {status.game_ready_count}
          </div>
          <div className="text-sm text-text-secondary">Ready for Game</div>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {status.total_activities - status.game_ready_count}
          </div>
          <div className="text-sm text-text-secondary">Need Attention</div>
        </Card>
      </div>
    </div>
  );
};

export default ReadinessOverview;
