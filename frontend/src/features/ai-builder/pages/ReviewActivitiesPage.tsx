import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles, Loader2, Check, ArrowLeft, MapPin, Clock, DollarSign,
  ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Link2
} from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import StepProgress from '../components/StepProgress';
import {
  aiBuilderAPI,
  DraftActivityResponse,
  DayGroup,
  AIBuilderSessionResponse
} from '../../../api/ai-builder';

const ReviewActivitiesPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<AIBuilderSessionResponse | null>(null);
  const [days, setDays] = useState<DayGroup[]>([]);
  const [activities, setActivities] = useState<DraftActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Stats
  const [totalNew, setTotalNew] = useState(0);
  const [totalReuse, setTotalReuse] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  const fetchData = useCallback(async () => {
    if (!sessionId) return;

    try {
      const [sessionData, draftData] = await Promise.all([
        aiBuilderAPI.getSession(sessionId),
        aiBuilderAPI.getDraftActivities(sessionId, selectedDay ?? undefined)
      ]);

      setSession(sessionData);
      setDays(draftData.days);
      setActivities(draftData.activities);
      setTotalNew(draftData.total_new);
      setTotalReuse(draftData.total_reuse);
      setTotalPending(draftData.total_pending);

      // Set default template name
      if (!templateName && sessionData.trip_title) {
        setTemplateName(sessionData.trip_title);
      }
    } catch (err: any) {
      toast.error('Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [sessionId, selectedDay, templateName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDayFilter = (dayNumber: number | null) => {
    setSelectedDay(dayNumber);
    setLoading(true);
  };

  const toggleCardExpand = (activityId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleDecision = async (activityId: string, decision: 'create_new' | 'reuse_existing', reuseActivityId?: string) => {
    if (!sessionId) return;

    try {
      await aiBuilderAPI.setDecision(sessionId, activityId, { decision, reuse_activity_id: reuseActivityId });

      // Update local state
      setActivities(prev => prev.map(a => {
        if (a.id === activityId) {
          return { ...a, decision };
        }
        return a;
      }));

      // Update stats
      if (decision === 'create_new') {
        setTotalNew(prev => prev + 1);
        setTotalPending(prev => Math.max(0, prev - 1));
      } else {
        setTotalReuse(prev => prev + 1);
        setTotalPending(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      toast.error('Failed to set decision');
    }
  };

  const handleBulkAction = async (action: 'accept_all_new' | 'auto_reuse_best' | 'clear_all') => {
    if (!sessionId) return;

    try {
      const result = await aiBuilderAPI.bulkDecision(sessionId, { action, match_threshold: 0.7 });
      setTotalNew(result.new_count);
      setTotalReuse(result.reuse_count);
      setTotalPending(0);

      // Refresh activities
      setLoading(true);
      await fetchData();

      toast.success(`Updated ${result.updated_count} activities`);
    } catch (err: any) {
      toast.error('Failed to apply bulk action');
    }
  };

  const handleCreateTemplate = async () => {
    if (!sessionId) return;

    if (totalPending > 0) {
      toast.warning(`Please decide on all ${totalPending} pending activities first`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await aiBuilderAPI.createTemplate(sessionId, templateName || undefined);
      navigate(`/ai-builder/session/${sessionId}/complete`, {
        state: { templateResult: result }
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Group activities by day for display
  const activitiesByDay: Record<number, DraftActivityResponse[]> = {};
  activities.forEach(a => {
    if (!activitiesByDay[a.day_number]) {
      activitiesByDay[a.day_number] = [];
    }
    activitiesByDay[a.day_number].push(a);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/ai-builder/session/${sessionId}/breakdown`)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Review Activities</h1>
                <p className="text-sm text-gray-500">
                  {session?.destination ? `Trip to ${session.destination}` : 'Review draft activities'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-3 text-sm">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  {totalNew} new
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {totalReuse} reuse
                </span>
                {totalPending > 0 && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                    {totalPending} pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <StepProgress currentStep={3} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Day Filter */}
          <div className="w-64 flex-shrink-0">
            <Card className="p-4 sticky top-32">
              <h3 className="font-medium text-gray-900 mb-3">Filter by Day</h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleDayFilter(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedDay === null
                      ? 'bg-purple-100 text-purple-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  All Days ({activities.length})
                </button>
                {days.map(day => (
                  <button
                    key={day.day_number}
                    onClick={() => handleDayFilter(day.day_number)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      selectedDay === day.day_number
                        ? 'bg-purple-100 text-purple-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Day {day.day_number} ({day.activity_count})
                    {day.day_title && (
                      <span className="block text-xs text-gray-500 truncate">
                        {day.day_title}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Bulk Actions */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleBulkAction('accept_all_new')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-green-50 text-green-700 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Create all as new
                  </button>
                  <button
                    onClick={() => handleBulkAction('auto_reuse_best')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-blue-50 text-blue-700 flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Auto-reuse best matches
                  </button>
                  <button
                    onClick={() => handleBulkAction('clear_all')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset all decisions
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content - Activity Cards */}
          <div className="flex-1 space-y-6">
            {Object.entries(activitiesByDay).map(([dayNum, dayActivities]) => {
              const day = days.find(d => d.day_number === parseInt(dayNum));
              return (
                <div key={dayNum}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm">
                      {dayNum}
                    </span>
                    {day?.day_title || `Day ${dayNum}`}
                  </h2>

                  <div className="space-y-3">
                    {dayActivities.map(activity => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        isExpanded={expandedCards.has(activity.id)}
                        onToggleExpand={() => toggleCardExpand(activity.id)}
                        onDecision={handleDecision}
                        sessionId={sessionId!}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Create Template Section */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Template</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter template name"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {totalPending > 0 ? (
                    <span className="text-yellow-600">
                      {totalPending} activities still need decisions
                    </span>
                  ) : (
                    <span className="text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      All activities reviewed
                    </span>
                  )}
                </div>

                <Button
                  onClick={handleCreateTemplate}
                  disabled={submitting || totalPending > 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Template'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Card Component
interface ActivityCardProps {
  activity: DraftActivityResponse;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDecision: (activityId: string, decision: 'create_new' | 'reuse_existing', reuseActivityId?: string) => void;
  sessionId: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isExpanded,
  onToggleExpand,
  onDecision
}) => {
  const decisionStyles = {
    pending: 'border-l-yellow-400',
    create_new: 'border-l-green-400',
    reuse_existing: 'border-l-blue-400'
  };

  return (
    <Card className={`border-l-4 ${decisionStyles[activity.decision]} overflow-hidden`}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {activity.activity_type_label && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  {activity.activity_type_label}
                </span>
              )}
              {activity.decision === 'create_new' && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  New
                </span>
              )}
              {activity.decision === 'reuse_existing' && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  Reuse
                </span>
              )}
            </div>
            <h4 className="font-medium text-gray-900">{activity.name}</h4>
            {activity.location_display && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="w-3 h-3" />
                {activity.location_display}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Match indicator */}
            {activity.match_score && activity.match_score > 0.5 && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Best match</div>
                <div className="text-sm font-medium text-blue-600">
                  {Math.round(activity.match_score * 100)}%
                </div>
              </div>
            )}

            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-gray-50">
          <div className="pt-4 space-y-4">
            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {activity.short_description && (
                <div className="col-span-2">
                  <label className="text-gray-500">Description</label>
                  <p className="text-gray-900">{activity.short_description}</p>
                </div>
              )}

              {activity.default_duration_value && (
                <div>
                  <label className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Duration
                  </label>
                  <p className="text-gray-900">
                    {activity.default_duration_value} {activity.default_duration_unit}
                  </p>
                </div>
              )}

              {activity.estimated_price && (
                <div>
                  <label className="text-gray-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Est. Price
                  </label>
                  <p className="text-gray-900">
                    {activity.currency_code} {activity.estimated_price}
                  </p>
                </div>
              )}
            </div>

            {/* Matched Activity Suggestion */}
            {activity.matched_activity_id && activity.matched_activity_name && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-blue-600 font-medium mb-1">
                      Similar activity found ({Math.round((activity.match_score || 0) * 100)}% match)
                    </div>
                    <div className="text-sm text-gray-900">{activity.matched_activity_name}</div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDecision(activity.id, 'reuse_existing', activity.matched_activity_id!)}
                    disabled={activity.decision === 'reuse_existing'}
                  >
                    {activity.decision === 'reuse_existing' ? 'Using' : 'Use this'}
                  </Button>
                </div>
              </div>
            )}

            {/* Decision Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant={activity.decision === 'create_new' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onDecision(activity.id, 'create_new')}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Create New Activity
              </Button>

              {activity.matched_activity_id && (
                <Button
                  variant={activity.decision === 'reuse_existing' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => onDecision(activity.id, 'reuse_existing', activity.matched_activity_id!)}
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Reuse Existing
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReviewActivitiesPage;
