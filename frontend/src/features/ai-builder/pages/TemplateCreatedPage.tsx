import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Sparkles, Check, ArrowRight, Image, DollarSign, Settings,
  ExternalLink, PartyPopper, FileText
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import StepProgress from '../components/StepProgress';
import { TemplateCreationResponse, NextStepItem } from '../../../api/ai-builder';

const TemplateCreatedPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get template result from navigation state
  const templateResult = location.state?.templateResult as TemplateCreationResponse | undefined;

  if (!templateResult) {
    // Redirect back if no result
    navigate(`/ai-builder/session/${sessionId}/review`);
    return null;
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'missing_images':
        return <Image className="w-5 h-5" />;
      case 'estimated_prices':
        return <DollarSign className="w-5 h-5" />;
      case 'fine_tune':
        return <Settings className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const handleNextStepClick = (step: NextStepItem) => {
    if (step.action_url) {
      navigate(step.action_url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Template Created!</h1>
              <p className="text-sm text-gray-500">Your itinerary template is ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress - Complete */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6">
          <StepProgress currentStep={4} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Success Banner */}
          <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {templateResult.template_name}
            </h2>

            <p className="text-gray-600 mb-6">
              Your {templateResult.num_days}-day {templateResult.destination} itinerary is ready
            </p>

            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {templateResult.activities_created}
                  </div>
                  <div className="text-gray-500">new activities</div>
                </div>
              </div>

              {templateResult.activities_reused > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      {templateResult.activities_reused}
                    </div>
                    <div className="text-gray-500">reused</div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Next Steps */}
          {templateResult.next_steps && templateResult.next_steps.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recommended Next Steps
              </h3>

              <div className="space-y-3">
                {templateResult.next_steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleNextStepClick(step)}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      {getStepIcon(step.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{step.title}</h4>
                        {step.count && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            {step.count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{step.detail}</p>
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/ai-builder')}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Create another template
            </button>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/templates')}
              >
                View All Templates
              </Button>

              <Button
                onClick={() => navigate(`/templates/${templateResult.template_id}/edit`)}
              >
                Open Template
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCreatedPage;
