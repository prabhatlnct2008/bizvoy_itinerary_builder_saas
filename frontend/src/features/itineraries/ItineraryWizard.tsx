import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronRight, Check, Eye } from 'lucide-react';
import Input from '../../components/ui/Input';
import templatesApi from '../../api/templates';
import itinerariesApi from '../../api/itineraries';
import { Template, ItineraryCreate } from '../../types';

type WizardStep = 1 | 2;
type StartingPointSelection = { type: 'scratch' } | { type: 'template'; template: Template } | null;

const ItineraryWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selection, setSelection] = useState<StartingPointSelection>(null);

  const [formData, setFormData] = useState({
    trip_name: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    destination: '',
    start_date: '',
    end_date: '',
    num_adults: 2,
    num_children: 0,
    special_notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await templatesApi.getTemplates({ status: 'published' });
      setTemplates(data);
    } catch (error: any) {
      toast.error('Failed to load templates');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelection({ type: 'template', template });
    setFormData((prev) => ({
      ...prev,
      destination: template.destination,
      trip_name: `${template.name} - `,
    }));
  };

  const handleStartFromScratch = () => {
    setSelection({ type: 'scratch' });
    setFormData((prev) => ({
      ...prev,
      destination: '',
      trip_name: '',
    }));
  };

  const handleNext = () => {
    if (!selection) {
      toast.error('Please select a starting point');
      return;
    }
    setCurrentStep(2);
  };

  const handleSkipToClientDetails = () => {
    setSelection({ type: 'scratch' });
    setCurrentStep(2);
  };

  const handleBack = () => setCurrentStep(1);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.trip_name.trim()) newErrors.trip_name = 'Trip name is required';
    if (!formData.client_name.trim()) newErrors.client_name = 'Client name is required';
    if (!formData.destination.trim()) newErrors.destination = 'Destination is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) newErrors.end_date = 'End date must be after start date';
    }
    if (formData.num_adults < 1) newErrors.num_adults = 'At least 1 adult is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload: ItineraryCreate = {
        ...formData,
        template_id: selection?.type === 'template' ? selection.template.id : undefined,
      };
      const created = await itinerariesApi.createItinerary(payload);
      toast.success('Itinerary created successfully');
      navigate(`/itineraries/${created.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create itinerary');
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectionSummary = () => {
    if (!selection) return null;
    if (selection.type === 'scratch') {
      return 'Starting point selected: Start from scratch';
    }
    const t = selection.template;
    return `Starting point selected: ${t.name} (${t.destination} • ${t.duration_days} days / ${t.duration_nights} nights)`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1080px] mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Page Header */}
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Create itinerary
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a starting point, then add client details and dates.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Step {currentStep} of 2 · You can modify days and activities later – this just sets the starting structure.
          </p>

          {/* Stepper */}
          <div className="flex items-center gap-3 mt-4 text-xs">
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 1
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-emerald-500 text-white'
              }`}>
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span className={`ml-1.5 text-xs font-medium ${
                currentStep === 1 ? 'text-slate-800' : 'text-slate-500'
              }`}>
                Starting point
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300" />

            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 2
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                2
              </div>
              <span className={`ml-1.5 text-xs font-medium ${
                currentStep === 2 ? 'text-slate-800' : 'text-slate-500'
              }`}>
                Client & dates
              </span>
            </div>
          </div>
        </div>

        {currentStep === 1 ? (
          <>
            {/* Main Card - Select a starting point */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 md:px-6 py-5 md:py-6">
              {/* Card Header Row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-slate-900">
                    Select a starting point
                  </h2>
                  <p className="mt-1 text-xs md:text-sm text-slate-500">
                    Choose a template or start from scratch. You can edit all details later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSkipToClientDetails}
                  className="text-xs md:text-sm text-slate-500 hover:text-slate-700 underline-offset-4 hover:underline transition"
                >
                  Skip to client details
                </button>
              </div>

              {/* Choices Grid */}
              <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-3">
                {/* Start from scratch card */}
                <ChoiceCard
                  selected={selection?.type === 'scratch'}
                  onClick={handleStartFromScratch}
                >
                  <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-slate-500">
                    FROM BLANK
                  </span>
                  <h3 className="mt-1 text-sm md:text-base font-semibold text-slate-900">
                    Start from scratch
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Build a custom itinerary without using a template.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 border border-slate-200 text-[11px] text-slate-500">
                      Full control
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 border border-slate-200 text-[11px] text-slate-500">
                      Unique trips
                    </span>
                  </div>
                </ChoiceCard>

                {/* Template cards */}
                {isLoading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : (
                  templates.map((template) => (
                    <TemplateChoiceCard
                      key={template.id}
                      template={template}
                      selected={selection?.type === 'template' && selection.template.id === template.id}
                      onClick={() => handleTemplateSelect(template)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="sticky bottom-0 mt-6 bg-slate-50/90 backdrop-blur-md border-t border-slate-200 px-5 md:px-0 py-4 -mx-4 md:mx-0">
              <div className="max-w-[1080px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                {/* Left Side - Selection Summary */}
                <div>
                  {selection ? (
                    <p className="text-xs md:text-sm text-slate-600">
                      {getSelectionSummary()}
                    </p>
                  ) : (
                    <p className="text-xs md:text-sm text-rose-600">
                      Please select a starting point to continue.
                    </p>
                  )}
                </div>

                {/* Right Side - Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/itineraries')}
                    className="text-xs md:text-sm text-slate-500 hover:text-slate-700 transition"
                  >
                    Back to itineraries
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!selection}
                    className={`inline-flex items-center justify-center rounded-lg text-sm font-semibold px-5 py-2.5 transition ${
                      selection
                        ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-sm'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    Next: Client & dates →
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Step 2 - Client & Dates */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 md:px-6 py-5 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900">
                  Client & Dates
                </h2>
                <p className="mt-1 text-xs md:text-sm text-slate-500">
                  Enter client information and trip dates
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Trip Name *</label>
                <Input
                  value={formData.trip_name}
                  onChange={(e) => handleChange('trip_name', e.target.value)}
                  placeholder="e.g., Bali Getaway 2024"
                  error={errors.trip_name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Destination *</label>
                <Input
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  placeholder="e.g., Bali, Indonesia"
                  error={errors.destination}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Name *</label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => handleChange('client_name', e.target.value)}
                  placeholder="Client full name"
                  error={errors.client_name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Email</label>
                <Input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => handleChange('client_email', e.target.value)}
                  placeholder="name@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Phone</label>
                <Input
                  value={formData.client_phone}
                  onChange={(e) => handleChange('client_phone', e.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date *</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  error={errors.start_date}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date *</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  error={errors.end_date}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Adults *</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.num_adults}
                  onChange={(e) => handleChange('num_adults', parseInt(e.target.value) || 1)}
                  error={errors.num_adults}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Children</label>
                <Input
                  type="number"
                  min={0}
                  value={formData.num_children}
                  onChange={(e) => handleChange('num_children', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Special Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  rows={3}
                  value={formData.special_notes}
                  onChange={(e) => handleChange('special_notes', e.target.value)}
                  placeholder="Any special requests or notes for this trip"
                />
              </div>
            </div>

            {/* Step 2 Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="text-xs md:text-sm text-slate-500 hover:text-slate-700 transition"
              >
                ← Back to starting point
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/itineraries')}
                  className="text-xs md:text-sm text-slate-500 hover:text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={`inline-flex items-center justify-center rounded-lg text-sm font-semibold px-5 py-2.5 transition ${
                    isSaving
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-sm'
                  }`}
                >
                  {isSaving ? 'Creating...' : 'Create Itinerary'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Choice Card Component */
interface ChoiceCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ selected, onClick, children }) => (
  <div className="relative group cursor-pointer h-full" onClick={onClick}>
    <div
      className={`rounded-2xl border px-4 py-4 flex flex-col h-full transition ${
        selected
          ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
          : 'border-slate-200 bg-slate-50/60 group-hover:border-amber-300 group-hover:bg-amber-50/70 group-hover:shadow-sm'
      }`}
    >
      {children}
    </div>
    {selected && (
      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
        <Check className="w-3 h-3" />
      </div>
    )}
  </div>
);

/* Template Choice Card Component */
interface TemplateChoiceCardProps {
  template: Template;
  selected: boolean;
  onClick: () => void;
}

const TemplateChoiceCard: React.FC<TemplateChoiceCardProps> = ({ template, selected, onClick }) => (
  <ChoiceCard selected={selected} onClick={onClick}>
    {/* Status chip */}
    <span
      className={`inline-flex items-center rounded-full text-[11px] font-medium px-2 py-0.5 self-start ${
        template.status === 'published'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {template.status === 'published' ? 'Published' : 'Draft'}
    </span>

    {/* Template name */}
    <h3 className="mt-2 text-sm md:text-base font-semibold text-slate-900">
      {template.name}
    </h3>

    {/* Destination & duration */}
    <p className="mt-0.5 text-xs text-slate-500">
      {template.destination} • {template.duration_days} days / {template.duration_nights} nights
    </p>

    {/* Meta pills row */}
    <div className="mt-3 flex flex-wrap gap-2">
      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 border border-slate-200 text-[11px] text-slate-600">
        {template.duration_days} days
      </span>
      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 border border-slate-200 text-[11px] text-slate-600">
        {template.destination.split(',')[0]}
      </span>
    </div>

    {/* Preview link */}
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        // TODO: Implement template preview
      }}
      className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-800 self-start"
    >
      <Eye className="w-3 h-3" />
      Preview template
    </button>
  </ChoiceCard>
);

/* Skeleton Loading Card */
const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4 animate-pulse">
    <div className="h-4 w-16 bg-slate-200 rounded-full" />
    <div className="mt-3 h-5 w-3/4 bg-slate-200 rounded" />
    <div className="mt-2 h-4 w-1/2 bg-slate-200 rounded" />
    <div className="mt-3 flex gap-2">
      <div className="h-5 w-14 bg-slate-200 rounded-full" />
      <div className="h-5 w-16 bg-slate-200 rounded-full" />
    </div>
  </div>
);

export default ItineraryWizard;
