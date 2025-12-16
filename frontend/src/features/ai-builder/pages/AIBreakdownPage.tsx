import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Loader2, Check, AlertCircle, ArrowLeft, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import StepProgress from '../components/StepProgress';
import { aiBuilderAPI, AIBuilderSessionResponse } from '../../../api/ai-builder';

const PROGRESS_STEPS = [
  { step: 1, label: 'Reading your content' },
  { step: 2, label: 'Detecting days & dates' },
  { step: 3, label: 'Finding stays, meals & experiences' },
  { step: 4, label: 'Grouping by day' },
  { step: 5, label: 'Drafting activity cards' },
];

const AIBreakdownPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<AIBuilderSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [_polling, setPolling] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      const data = await aiBuilderAPI.getSession(sessionId);
      setSession(data);

      // Stop polling if completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        setPolling(false);
      }
    } catch (err: any) {
      toast.error('Failed to fetch session status');
      setPolling(false);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Polling for progress
  useEffect(() => {
    if (!session) return;

    if (session.status === 'pending' || session.status === 'processing') {
      setPolling(true);
      const interval = setInterval(fetchSession, 2000);
      return () => clearInterval(interval);
    }
  }, [session?.status, fetchSession]);

  const handleRetry = () => {
    navigate('/ai-builder');
  };

  const handleReviewActivities = () => {
    navigate(`/ai-builder/session/${sessionId}/review`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Session not found</h2>
          <p className="text-gray-500 mt-2">This session may have expired or doesn't exist.</p>
          <Button onClick={() => navigate('/ai-builder')} className="mt-4">
            Start Over
          </Button>
        </Card>
      </div>
    );
  }

  const isProcessing = session.status === 'pending' || session.status === 'processing';
  const isCompleted = session.status === 'completed';
  const isFailed = session.status === 'failed';

  // Calculate summary stats
  const summary = session.parsed_summary || {};
  const totalActivities = (summary.stays || 0) + (summary.meals || 0) + (summary.experiences || 0) + (summary.transfers || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/ai-builder')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Itinerary Builder</h1>
              <p className="text-sm text-gray-500">
                {isProcessing ? 'Processing your content...' : isCompleted ? 'Ready for review' : 'Processing failed'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6">
          <StepProgress currentStep={isCompleted ? 3 : 2} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Progress Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {isProcessing ? 'AI is turning your notes into activities...' :
               isCompleted ? 'Processing complete!' :
               'Processing failed'}
            </h2>

            {/* Progress Steps */}
            <div className="space-y-4">
              {PROGRESS_STEPS.map((step) => {
                const isStepComplete = session.current_step > step.step || isCompleted;
                const isStepActive = session.current_step === step.step && isProcessing;

                return (
                  <div key={step.step} className="flex items-center gap-4">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        transition-all duration-300
                        ${isStepComplete
                          ? 'bg-green-100 text-green-600'
                          : isStepActive
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-400'
                        }
                      `}
                    >
                      {isStepComplete ? (
                        <Check className="w-4 h-4" />
                      ) : isStepActive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-sm font-medium">{step.step}</span>
                      )}
                    </div>
                    <span
                      className={`
                        text-sm font-medium
                        ${isStepComplete
                          ? 'text-green-600'
                          : isStepActive
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {isFailed && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">Processing failed</p>
                    <p className="text-sm text-red-600 mt-1">
                      {session.error_message || 'An error occurred while processing your content.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Preview Card - Only show when completed */}
          {isCompleted && (
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>

              <div className="flex items-center gap-6 mb-4">
                {session.destination && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>Trip to {session.destination}</span>
                  </div>
                )}
                {session.detected_days && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{session.detected_days} days</span>
                  </div>
                )}
              </div>

              {totalActivities > 0 && (
                <div className="flex flex-wrap gap-3 text-sm">
                  {summary.stays && summary.stays > 0 && (
                    <span className="px-3 py-1 bg-white rounded-full text-gray-700 shadow-sm">
                      {summary.stays} stay{summary.stays > 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.meals && summary.meals > 0 && (
                    <span className="px-3 py-1 bg-white rounded-full text-gray-700 shadow-sm">
                      {summary.meals} meal{summary.meals > 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.experiences && summary.experiences > 0 && (
                    <span className="px-3 py-1 bg-white rounded-full text-gray-700 shadow-sm">
                      {summary.experiences} experience{summary.experiences > 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.transfers && summary.transfers > 0 && (
                    <span className="px-3 py-1 bg-white rounded-full text-gray-700 shadow-sm">
                      {summary.transfers} transfer{summary.transfers > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-600 mt-4">
                You'll be able to edit everything in the next step.
              </p>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {isCompleted && (
              <Button onClick={handleReviewActivities}>
                Review activities
              </Button>
            )}

            {isFailed && (
              <Button onClick={handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Go back & edit text
              </Button>
            )}

            <button
              onClick={handleRetry}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIBreakdownPage;
