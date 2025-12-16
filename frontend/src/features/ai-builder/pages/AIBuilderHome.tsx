import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import StepProgress from '../components/StepProgress';
import { aiBuilderAPI, AIBuilderStatusResponse } from '../../../api/ai-builder';

const SAMPLE_TRIP_CONTENT = `Day 1 - Arrival in Goa
- Airport pickup from Dabolim Airport
- Check-in at Taj Fort Aguada Resort & Spa
- Welcome drink and resort orientation
- Evening leisure at the beach
- Dinner at the resort's seafood restaurant

Day 2 - North Goa Exploration
- Breakfast at the resort
- Visit Fort Aguada and lighthouse
- Explore Calangute Beach
- Lunch at a beach shack (Curlies or Britto's)
- Water sports activities (parasailing, jet ski)
- Evening visit to Anjuna Flea Market
- Dinner at Thalassa Greek restaurant

Day 3 - South Goa & Spice Plantation
- Breakfast and check-out
- Drive to South Goa
- Visit Sahakari Spice Farm - spice tour and traditional lunch
- Explore Colva Beach
- Visit the Basilica of Bom Jesus (UNESCO site)
- Evening free time
- Dinner at Martin's Corner

Day 4 - Departure
- Breakfast at hotel
- Last-minute shopping at Mapusa Market
- Airport drop for departure`;

const AIBuilderHome: React.FC = () => {
  const navigate = useNavigate();
  const [_status, setStatus] = useState<AIBuilderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);

  const [formData, setFormData] = useState({
    destination: '',
    trip_title: '',
    num_days: '',
    raw_content: '',
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const data = await aiBuilderAPI.getStatus();
      setStatus(data);
      if (!data.enabled) {
        toast.error('AI Itinerary Builder is not enabled for your agency');
        navigate('/');
      }
    } catch (err: any) {
      toast.error('Failed to check AI Builder status');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.raw_content.trim()) {
      toast.error('Please paste your trip content');
      return;
    }

    if (formData.raw_content.trim().length < 50) {
      toast.error('Trip content is too short. Please provide more details.');
      return;
    }

    try {
      setSubmitting(true);
      const session = await aiBuilderAPI.createSession({
        destination: formData.destination || undefined,
        trip_title: formData.trip_title || undefined,
        num_days: formData.num_days ? parseInt(formData.num_days) : undefined,
        raw_content: formData.raw_content,
      });

      navigate(`/ai-builder/session/${session.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to start AI processing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseSample = () => {
    setFormData({
      destination: 'Goa',
      trip_title: 'Goa 4D3N - Beach & Culture',
      num_days: '4',
      raw_content: SAMPLE_TRIP_CONTENT,
    });
    setShowSampleModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Itinerary Builder</h1>
              <p className="text-sm text-gray-500">Turn messy trip notes into reusable templates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <StepProgress currentStep={1} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Panel - Instructions */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Turn messy trip notes into a reusable template
              </h2>
              <p className="text-gray-600 mb-6">
                Paste your existing itinerary, email, or WhatsApp chat. We'll detect days, stays, meals, and experiences for you.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Include dates or "Day 1/Day 2" markers if possible
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Mention hotel names, meal plans, and key experiences
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Remove personal names or sensitive info before pasting
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowSampleModal(true)}
                className="mt-6 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                <Info className="w-4 h-4" />
                See a sample input
              </button>
            </Card>
          </div>

          {/* Right Panel - Form */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination
                    </label>
                    <Input
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="e.g., Goa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of days
                      <span className="text-gray-400 font-normal"> (optional)</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.num_days}
                      onChange={(e) => setFormData({ ...formData, num_days: e.target.value })}
                      placeholder="Auto-detect"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If left blank, we'll infer days from your content.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal trip name
                    <span className="text-gray-400 font-normal"> (optional)</span>
                  </label>
                  <Input
                    value={formData.trip_title}
                    onChange={(e) => setFormData({ ...formData, trip_title: e.target.value })}
                    placeholder="Goa 4D3N – Beach & Nightlife"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll use this as the base for your template name.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raw Trip Content <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={formData.raw_content}
                    onChange={(e) => setFormData({ ...formData, raw_content: e.target.value })}
                    placeholder="Paste any email, Word doc text, or WhatsApp conversation that describes the trip..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      Minimum 50 characters required
                    </p>
                    <p className={`text-xs ${formData.raw_content.length < 50 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.raw_content.length} characters
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || formData.raw_content.length < 50}
                  className="w-full md:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Let AI read this
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* Sample Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Sample Trip Input</h3>
              <p className="text-sm text-gray-500 mt-1">
                Here's an example of what you can paste into the AI Builder
              </p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg">
                {SAMPLE_TRIP_CONTENT}
              </pre>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowSampleModal(false)}>
                Close
              </Button>
              <Button onClick={handleUseSample}>
                Use this sample
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIBuilderHome;
