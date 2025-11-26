import React, { useState, useEffect } from 'react';
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

  // Step 1: Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [startFromScratch, setStartFromScratch] = useState(false);

  // Step 2: Client & dates
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
    // Pre-fill destination from template
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

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.trip_name.trim()) {
      newErrors.trip_name = 'Trip name is required';
    }

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required';
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (formData.num_adults < 1) {
      newErrors.num_adults = 'At least 1 adult is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);

    try {
      const createData: ItineraryCreate = {
        template_id: selectedTemplate?.id || null,
        trip_name: formData.trip_name,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        destination: formData.destination,
        start_date: formData.start_date,
        end_date: formData.end_date,
        num_adults: formData.num_adults,
        num_children: formData.num_children,
        special_notes: formData.special_notes || null,
        status: 'draft',
      };

      const created = await itinerariesApi.createItinerary(createData);
      toast.success('Itinerary created successfully!');
      navigate(`/itineraries/${created.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create itinerary');
    } finally {
      setIsSaving(false);
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-primary">Create New Itinerary</h1>
        <p className="text-secondary mt-1">
          Step {currentStep} of 2: {currentStep === 1 ? 'Select Template' : 'Client & Dates'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        <div className="flex items-center flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-muted'
            }`}
          >
            1
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div
              className={`h-full ${
                currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'
              } transition-all`}
              style={{ width: currentStep >= 2 ? '100%' : '0%' }}
            />
          </div>
        </div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-muted'
          }`}
        >
          2
        </div>
      </div>

      {/* Step 1: Template Selection */}
      {currentStep === 1 && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary mb-2">Choose a starting point</h2>
            <p className="text-secondary">
              Select a template to pre-populate the itinerary, or start from scratch
            </p>
          </div>

          {/* Start from Scratch Option */}
          <div
            onClick={handleStartFromScratch}
            className={`mb-6 p-6 border-2 rounded-lg cursor-pointer transition-all ${
              startFromScratch
                ? 'border-primary-600 bg-primary-50'
                : 'border-border hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">Start from Scratch</h3>
                <p className="text-sm text-secondary">Build a custom itinerary from the ground up</p>
              </div>
              {startFromScratch && (
                <Chip label="Selected" variant="success" />
              )}
            </div>
          </div>

          {/* Template Grid */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Or choose a template:</h3>

            {templates.length === 0 ? (
              <Card>
                <div className="p-8 text-center text-muted">
                  No published templates available. Start from scratch to create your itinerary.
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer overflow-hidden border-2 ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary-600'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-primary">{template.name}</h3>
                        {selectedTemplate?.id === template.id && (
                          <Chip label="Selected" variant="success" size="sm" />
                        )}
                      </div>

                      <p className="text-sm text-secondary mb-2">{template.destination}</p>

                      <div className="flex items-center gap-4 text-sm text-muted mb-3">
                        <span>
                          {template.duration_nights}N / {template.duration_days}D
                        </span>
                        {template.approximate_price && <span>${template.approximate_price}</span>}
                      </div>

                      {template.description && (
                        <p className="text-sm text-muted line-clamp-2">{template.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="secondary" onClick={() => navigate('/itineraries')}>
              Cancel
            </Button>
            <Button onClick={handleNext}>Next: Client & Dates →</Button>
          </div>
        </div>
      )}

      {/* Step 2: Client & Dates */}
      {currentStep === 2 && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-primary mb-2">Trip Details</h2>
              <p className="text-secondary mb-6">Enter the client information and trip dates</p>

              {/* Trip Name */}
              <div className="mb-4">
                <Input
                  label="Trip Name"
                  value={formData.trip_name}
                  onChange={(e) => handleChange('trip_name', e.target.value)}
                  error={errors.trip_name}
                  placeholder="e.g., Kerala Family Vacation 2025"
                  required
                />
              </div>

              {/* Client Information */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-primary mb-3">Client Information</h3>
                <div className="space-y-4">
                  <Input
                    label="Client Name"
                    value={formData.client_name}
                    onChange={(e) => handleChange('client_name', e.target.value)}
                    error={errors.client_name}
                    placeholder="John Doe"
                    required
                  />
                  <Input
                    label="Email (Optional)"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleChange('client_email', e.target.value)}
                    error={errors.client_email}
                    placeholder="john@example.com"
                  />
                  <Input
                    label="Phone (Optional)"
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => handleChange('client_phone', e.target.value)}
                    error={errors.client_phone}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              {/* Trip Details */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-primary mb-3">Trip Details</h3>
                <div className="space-y-4">
                  <Input
                    label="Destination"
                    value={formData.destination}
                    onChange={(e) => handleChange('destination', e.target.value)}
                    error={errors.destination}
                    placeholder="Kerala, India"
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleChange('start_date', e.target.value)}
                      error={errors.start_date}
                      required
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleChange('end_date', e.target.value)}
                      error={errors.end_date}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Number of Adults"
                      type="number"
                      min="1"
                      value={formData.num_adults}
                      onChange={(e) => handleChange('num_adults', parseInt(e.target.value) || 1)}
                      error={errors.num_adults}
                      required
                    />
                    <Input
                      label="Number of Children"
                      type="number"
                      min="0"
                      value={formData.num_children}
                      onChange={(e) => handleChange('num_children', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Special Notes (Optional)
                    </label>
                    <textarea
                      value={formData.special_notes}
                      onChange={(e) => handleChange('special_notes', e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                      rows={3}
                      placeholder="Any special requirements, dietary restrictions, etc."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="secondary" onClick={handleBack}>
              ← Back
            </Button>
            <Button onClick={handleCreate} isLoading={isSaving}>
              Create Itinerary
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryWizard;
