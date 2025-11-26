import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Save, ArrowLeft, CheckCircle } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import templatesApi from '../../api/templates';
import activitiesApi from '../../api/activities';
import { useTemplateStore } from '../../store/templateStore';
import {
  TemplateCreate,
  TemplateUpdate,
  TemplateDayCreate,
  ActivityDetail,
} from '../../types';
import DayTimeline from './components/DayTimeline';
import DayActivityList from './components/DayActivityList';
import ActivityPicker from './components/ActivityPicker';

const TemplateBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id && id !== 'new';

  // Zustand store
  const {
    days,
    selectedDayIndex,
    hasUnsavedChanges,
    setTemplate,
    setDays,
    setSelectedDayIndex,
    updateDay,
    addActivityToDay,
    removeActivityFromDay,
    moveActivity,
    updateActivity,
    reorderActivities,
    clearTemplate,
    markSaved,
  } = useTemplateStore();

  // Local state
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    duration_days: 1,
    duration_nights: 0,
    description: '',
    approximate_price: '',
    status: 'draft' as 'draft' | 'published',
  });

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchTemplate();
    } else {
      // Initialize with one day for new templates
      initializeNewTemplate();
    }
    fetchActivities();

    return () => {
      clearTemplate();
    };
  }, [id]);

  useEffect(() => {
    // Auto-generate days array when duration changes
    const newDays: TemplateDayCreate[] = [];
    for (let i = 1; i <= formData.duration_days; i++) {
      const existingDay = days.find((d) => d.day_number === i);
      newDays.push(
        existingDay || {
          day_number: i,
          title: `Day ${i}`,
          notes: '',
          activities: [],
        }
      );
    }
    setDays(newDays);
  }, [formData.duration_days]);

  const initializeNewTemplate = () => {
    setDays([
      {
        day_number: 1,
        title: 'Day 1',
        notes: '',
        activities: [],
      },
    ]);
  };

  const fetchTemplate = async () => {
    try {
      setIsLoading(true);
      const data = await templatesApi.getTemplate(id!);
      setFormData({
        name: data.name,
        destination: data.destination,
        duration_days: data.duration_days,
        duration_nights: data.duration_nights,
        description: data.description || '',
        approximate_price: data.approximate_price?.toString() || '',
        status: data.status,
      });
      setTemplate(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load template');
      navigate('/templates');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await activitiesApi.getActivities({ status: 'active' });
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDayChange = (field: string, value: any) => {
    updateDay(selectedDayIndex, { [field]: value });
  };

  const handleAddActivity = (activity: ActivityDetail) => {
    const newActivity = {
      activity_id: activity.id,
      display_order: days[selectedDayIndex].activities.length,
      time_slot: null,
      custom_notes: null,
    };

    addActivityToDay(selectedDayIndex, newActivity);
    setIsActivityModalOpen(false);
    toast.success(`Added ${activity.name} to Day ${days[selectedDayIndex].day_number}`);
  };

  const validate = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return false;
    }
    if (!formData.destination.trim()) {
      toast.error('Destination is required');
      return false;
    }
    if (formData.duration_days < 1) {
      toast.error('Duration must be at least 1 day');
      return false;
    }
    return true;
  };

  const handleSave = async (publish = false) => {
    if (!validate()) return;

    setIsSaving(true);

    try {
      const submitData: TemplateCreate | TemplateUpdate = {
        name: formData.name,
        destination: formData.destination,
        duration_days: formData.duration_days,
        duration_nights: formData.duration_nights,
        description: formData.description || null,
        approximate_price: formData.approximate_price
          ? parseFloat(formData.approximate_price)
          : null,
        status: publish ? 'published' : 'draft',
        days,
      };

      if (isEditMode) {
        await templatesApi.updateTemplate(id!, submitData);
        toast.success('Template updated successfully');
        markSaved();
      } else {
        const created = await templatesApi.createTemplate(submitData as TemplateCreate);
        toast.success('Template created successfully');
        navigate(`/templates/${created.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentDay = days[selectedDayIndex];
  const selectedActivityIds = currentDay?.activities.map((a) => a.activity_id) || [];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/templates')}
              className="text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-primary">
                {isEditMode ? 'Edit Template' : 'Create Template'}
              </h1>
              {hasUnsavedChanges && (
                <p className="text-xs text-muted mt-1">Unsaved changes</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/templates')}>
              Cancel
            </Button>
            <Button onClick={() => handleSave(false)} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save & Publish
            </Button>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-0">
          {/* Left Column - Template Metadata */}
          <div className="col-span-3 bg-white border-r border-border overflow-y-auto">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-primary mb-4">Template Details</h2>

              <Input
                label="Template Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Kerala Premium 5D/4N"
                required
              />

              <Input
                label="Destination"
                value={formData.destination}
                onChange={(e) => handleChange('destination', e.target.value)}
                placeholder="e.g., Kerala, India"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Days"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => handleChange('duration_days', parseInt(e.target.value) || 1)}
                  required
                />
                <Input
                  label="Nights"
                  type="number"
                  min="0"
                  value={formData.duration_nights}
                  onChange={(e) => handleChange('duration_nights', parseInt(e.target.value) || 0)}
                />
              </div>

              <Input
                label="Approx. Price"
                type="number"
                value={formData.approximate_price}
                onChange={(e) => handleChange('approximate_price', e.target.value)}
                placeholder="0.00"
              />

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  placeholder="Brief description of the template..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Middle Column - Day Timeline */}
          <div className="col-span-3 bg-gray-50 border-r border-border overflow-y-auto">
            <div className="p-6">
              <DayTimeline
                days={days}
                selectedDayIndex={selectedDayIndex}
                onSelectDay={setSelectedDayIndex}
              />
            </div>
          </div>

          {/* Right Column - Selected Day Activities */}
          <div className="col-span-6 bg-white overflow-y-auto">
            {currentDay && (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-primary">
                      Day {currentDay.day_number} Activities
                    </h2>
                    <Button size="sm" onClick={() => setIsActivityModalOpen(true)}>
                      Add Activity
                    </Button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <Input
                      label="Day Title"
                      value={currentDay.title || ''}
                      onChange={(e) => handleDayChange('title', e.target.value)}
                      placeholder={`e.g., Arrival in ${formData.destination || 'destination'}`}
                    />

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">
                        Day Notes
                      </label>
                      <textarea
                        value={currentDay.notes || ''}
                        onChange={(e) => handleDayChange('notes', e.target.value)}
                        rows={2}
                        placeholder="Optional notes for this day..."
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Activity Schedule</h3>
                  <DayActivityList
                    activities={currentDay.activities}
                    activityDetails={activities}
                    onRemove={(index) => removeActivityFromDay(selectedDayIndex, index)}
                    onMoveUp={(index) => moveActivity(selectedDayIndex, index, 'up')}
                    onMoveDown={(index) => moveActivity(selectedDayIndex, index, 'down')}
                    onReorder={(startIndex, endIndex) =>
                      reorderActivities(selectedDayIndex, startIndex, endIndex)
                    }
                    onUpdateActivity={(index, updates) =>
                      updateActivity(selectedDayIndex, index, updates)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Selection Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title={`Add Activity to Day ${currentDay?.day_number || ''}`}
        size="lg"
      >
        <ActivityPicker
          onSelectActivity={handleAddActivity}
          selectedActivityIds={selectedActivityIds}
        />
      </Modal>
    </div>
  );
};

export default TemplateBuilder;
