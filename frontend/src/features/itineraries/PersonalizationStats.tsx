import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, ExternalLink } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getItineraryAnalytics } from '../../api/gamification';

interface ItineraryAnalytics {
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  confirmation_rate: number;
  total_revenue_added: number;
}

interface PersonalizationStatsProps {
  itineraryId: string;
}

const PersonalizationStats: React.FC<PersonalizationStatsProps> = ({ itineraryId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ItineraryAnalytics | null>(null);

  useEffect(() => {
    loadStats();
  }, [itineraryId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getItineraryAnalytics(itineraryId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-6 text-text-secondary">
          Loading personalization stats...
        </div>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Personalization Stats
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/itineraries/${itineraryId}/analytics`)}
          className="flex items-center gap-2"
        >
          View Details
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {stats.total_sessions === 0 ? (
        <div className="text-center py-8">
          <div className="text-text-secondary mb-2">No personalization sessions yet</div>
          <div className="text-sm text-text-muted">
            Stats will appear once travelers start personalizing this itinerary
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sessions */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {stats.total_sessions}
              </div>
              <div className="text-sm text-text-secondary">
                {stats.total_sessions === 1 ? 'Session' : 'Sessions'}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {stats.completed_sessions} completed
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {Math.round(stats.completion_rate)}%
              </div>
              <div className="text-sm text-text-secondary">Completion</div>
              <div className="text-xs text-text-muted mt-1">
                {Math.round(stats.confirmation_rate)}% confirmed
              </div>
            </div>
          </div>

          {/* Revenue Added */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {formatCurrency(stats.total_revenue_added)}
              </div>
              <div className="text-sm text-text-secondary">Revenue Added</div>
              <div className="text-xs text-text-muted mt-1">
                via personalization
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PersonalizationStats;
