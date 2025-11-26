import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import templatesApi from '../../api/templates';
import itinerariesApi from '../../api/itineraries';
import { Template, ItineraryCreate } from '../../types';

type WizardStep = 1 | 2;

const ItineraryWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [startFromScratch, setStartFromScratch] = useState(false);

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
    setSelectedTemplate(template);
    setStartFromScratch(false);
    setFormData((prev) => ({
      ...prev,
      destination: template.destination,
      trip_name: `${template.name} - `,
    }));
  };

  const handleStartFromScratch = () => {
    setSelectedTemplate(null);
    setStartFromScratch(true);
    setFormData((prev) => ({
      ...prev,
      destination: '',
      trip_name: '',
    }));
  };

  const handleNext = () => {
    if (!selectedTemplate && !startFromScratch) {
      toast.error('Please select a template or start from scratch');
      return;
    }
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
        template_id: selectedTemplate ? selectedTemplate.id : undefined,
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

  return (
    <div className="px-4 py-6 md:px-6 md:py-6 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Create Itinerary</h1>
            <p className="text-text-muted mt-1">Two quick steps to get started</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/itineraries')}>Cancel</Button>
            {currentStep === 2 && <Button variant="secondary" onClick={handleBack}>Back</Button>}
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <StepperStep number={1} active={currentStep === 1} title="Starting Point" subtitle="Template or scratch" />
          <div className="flex-1 h-px bg-border" />
          <StepperStep number={2} active={currentStep === 2} title="Client & Dates" subtitle="Who and when" />
        </div>

        {currentStep === 1 ? (
          <Card className="p-5 border border-border rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Select a starting point</h2>
                <p className="text-sm text-text-muted">Choose a template or start from scratch</p>
              </div>
              <Button variant="outline" onClick={handleNext}>Skip to Client Details</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleStartFromScratch}
                className={`text-left p-4 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${startFromScratch ? 'border-primary-200 bg-primary-100/40' : 'border-border hover:border-primary-100'}`}
              >
                <p className="font-semibold text-text-primary">Start from scratch</p>
                <p className="text-text-muted text-sm">Build a custom itinerary without a template.</p>
              </button>

              {templates.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`text-left p-4 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${selectedTemplate?.id === template.id ? 'border-primary-200 bg-primary-100/40' : 'border-border hover:border-primary-100'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-text-primary">{template.name}</p>
                      <p className="text-sm text-text-secondary">{template.destination}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 capitalize border border-border">{template.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <Chip label={`${template.duration_days} days`} />
                    <Chip label={`${template.duration_nights} nights`} />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-5 border border-border rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Client & Dates</h2>
                <p className="text-sm text-text-muted">Enter client information and trip dates</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleBack}>Back</Button>
                <Button onClick={handleSubmit} disabled={isSaving}>Create Itinerary</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Trip Name *</label>
                <Input
                  value={formData.trip_name}
                  onChange={(e) => handleChange('trip_name', e.target.value)}
                  placeholder="e.g., Bali Getaway 2024"
                  hasError={!!errors.trip_name}
                />
                {errors.trip_name && <p className="text-sm text-error mt-1">{errors.trip_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Destination *</label>
                <Input
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  placeholder="e.g., Bali, Indonesia"
                  hasError={!!errors.destination}
                />
                {errors.destination && <p className="text-sm text-error mt-1">{errors.destination}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Client Name *</label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => handleChange('client_name', e.target.value)}
                  placeholder="Client full name"
                  hasError={!!errors.client_name}
                />
                {errors.client_name && <p className="text-sm text-error mt-1">{errors.client_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Client Email</label>
                <Input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => handleChange('client_email', e.target.value)}
                  placeholder="name@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Client Phone</label>
                <Input
                  value={formData.client_phone}
                  onChange={(e) => handleChange('client_phone', e.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Start Date *</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  hasError={!!errors.start_date}
                />
                {errors.start_date && <p className="text-sm text-error mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">End Date *</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  hasError={!!errors.end_date}
                />
                {errors.end_date && <p className="text-sm text-error mt-1">{errors.end_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Adults *</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.num_adults}
                  onChange={(e) => handleChange('num_adults', parseInt(e.target.value))}
                  hasError={!!errors.num_adults}
                />
                {errors.num_adults && <p className="text-sm text-error mt-1">{errors.num_adults}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Children</label>
                <Input
                  type="number"
                  min={0}
                  value={formData.num_children}
                  onChange={(e) => handleChange('num_children', parseInt(e.target.value))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1">Special Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  value={formData.special_notes}
                  onChange={(e) => handleChange('special_notes', e.target.value)}
                  placeholder="Any special requests or notes for this trip"
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const StepperStep: React.FC<{ number: number; active: boolean; title: string; subtitle: string }> = ({ number, active, title, subtitle }) => (
  <div className={`flex items-center gap-2 ${active ? 'text-primary-600' : 'text-text-muted'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold border ${active ? 'bg-primary-100 border-primary-200 text-primary-700' : 'bg-white border-border text-text-muted'}`}>
      {number}
    </div>
    <div>
      <p className="font-semibold text-text-primary">{title}</p>
      <p className="text-xs text-text-muted">{subtitle}</p>
    </div>
  </div>
);

export default ItineraryWizard;
