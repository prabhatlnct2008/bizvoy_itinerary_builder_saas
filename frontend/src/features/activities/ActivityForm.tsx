import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Dropdown from '../../components/ui/Dropdown';
import Chip from '../../components/ui/Chip';
import { usePermissions } from '../../hooks/usePermissions';
import activitiesApi from '../../api/activities';
import activityTypesApi from '../../api/activityTypes';
import { getAgencyVibes, updateActivityGamification } from '../../api/gamification';
import { ActivityType, ActivityCreate, ActivityUpdate, ActivityImage } from '../../types';
import { Star, Clock, Users, DollarSign, Plus, X, Upload, Trash2, Image as ImageIcon, Sparkles, Eye } from 'lucide-react';
import { ActivityPreviewModal } from '../../components/modals';

interface AgencyVibe {
  id: string;
  key: string;
  display_name: string;
  emoji: string;
  color: string;
  enabled: boolean;
  is_custom: boolean;
  order: number;
}

const ActivityForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();

  const isEdit = Boolean(id);
  const canCreate = hasPermission('activities.create');
  const canEdit = hasPermission('activities.edit');

  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [images, setImages] = useState<ActivityImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [newHighlight, setNewHighlight] = useState('');
  const [agencyVibes, setAgencyVibes] = useState<AgencyVibe[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    activity_type_id: '',
    category_label: '',
    location_display: '',
    short_description: '',
    client_description: '',
    default_duration_value: '',
    default_duration_unit: 'hours',
    rating: '',
    group_size_label: '',
    cost_type: 'included',
    cost_display: '',
    highlights: [] as string[],
    tags: [] as string[],
    is_active: true,
    internal_notes: '',
  });

  useEffect(() => {
    fetchActivityTypes();
    fetchVibes();
    if (id) {
      fetchActivity(id);
    }
  }, [id]);

  const fetchActivityTypes = async () => {
    try {
      const data = await activityTypesApi.getActivityTypes();
      setActivityTypes(data);
    } catch (error: any) {
      toast.error('Failed to load activity types');
    }
  };

  const fetchVibes = async () => {
    try {
      const vibes = await getAgencyVibes();
      // Only show enabled vibes
      setAgencyVibes((vibes as AgencyVibe[]).filter((v) => v.enabled));
    } catch (error: any) {
      // Silently fail - vibes are optional
      console.error('Failed to load vibes:', error);
    }
  };

  const fetchActivity = async (activityId: string) => {
    try {
      setIsLoading(true);
      const data = await activitiesApi.getActivity(activityId);
      setImages(data.images || []);

      // Parse highlights and tags from JSON if needed
      let parsedHighlights: string[] = [];
      let parsedTags: string[] = [];

      if (data.highlights) {
        try {
          parsedHighlights = typeof data.highlights === 'string'
            ? JSON.parse(data.highlights)
            : data.highlights;
        } catch {
          parsedHighlights = [];
        }
      }

      if (data.tags) {
        try {
          parsedTags = typeof data.tags === 'string'
            ? JSON.parse(data.tags)
            : data.tags;
        } catch {
          parsedTags = [];
        }
      }

      setFormData({
        name: data.name || '',
        activity_type_id: data.activity_type_id || '',
        category_label: data.category_label || '',
        location_display: data.location_display || data.location || '',
        short_description: data.short_description || '',
        client_description: data.client_description || data.description || '',
        default_duration_value: data.default_duration_value?.toString() || '',
        default_duration_unit: data.default_duration_unit || 'hours',
        rating: data.rating?.toString() || '',
        group_size_label: data.group_size_label || '',
        cost_type: data.cost_type || 'included',
        cost_display: data.cost_display || '',
        highlights: parsedHighlights,
        tags: parsedTags,
        is_active: data.is_active ?? true,
        internal_notes: data.internal_notes || '',
      });

      // Load vibe_tags
      if (data.vibe_tags) {
        try {
          const parsedVibeTags = typeof data.vibe_tags === 'string'
            ? JSON.parse(data.vibe_tags)
            : data.vibe_tags;
          setSelectedVibes(parsedVibeTags);
        } catch {
          setSelectedVibes([]);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load activity');
      navigate('/activities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;

    try {
      setUploadingImages(true);
      for (const file of Array.from(files)) {
        const uploadedImage = await activitiesApi.uploadImage(id, file);
        setImages((prev) => [...prev, uploadedImage]);
      }
      toast.success('Images uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!id) return;
    try {
      await activitiesApi.deleteImage(id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success('Image deleted');
    } catch (error: any) {
      toast.error('Failed to delete image');
    }
  };

  const handleSetHeroImage = async (imageId: string) => {
    if (!id) return;
    try {
      await activitiesApi.updateImage(id, imageId, { is_hero: true });
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_hero: img.id === imageId,
          is_primary: img.id === imageId,
        }))
      );
      toast.success('Hero image updated');
    } catch (error: any) {
      toast.error('Failed to update hero image');
    }
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim() && !formData.highlights.includes(newHighlight.trim())) {
      setFormData({
        ...formData,
        highlights: [...formData.highlights, newHighlight.trim()],
      });
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== index),
    });
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag.trim()],
      });
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handleToggleVibe = (vibeKey: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibeKey)
        ? prev.filter((k) => k !== vibeKey)
        : [...prev, vibeKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Activity name is required');
      return;
    }

    if (!formData.activity_type_id) {
      toast.error('Activity type is required');
      return;
    }

    try {
      setIsSaving(true);

      const data: ActivityCreate | ActivityUpdate = {
        name: formData.name,
        activity_type_id: formData.activity_type_id,
        category_label: formData.category_label || undefined,
        location_display: formData.location_display || undefined,
        short_description: formData.short_description || undefined,
        client_description: formData.client_description || undefined,
        default_duration_value: formData.default_duration_value
          ? parseInt(formData.default_duration_value)
          : undefined,
        default_duration_unit: formData.default_duration_unit || undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
        group_size_label: formData.group_size_label || undefined,
        cost_type: formData.cost_type,
        cost_display: formData.cost_display || undefined,
        highlights: formData.highlights.length > 0
          ? formData.highlights
          : [],
        tags: formData.tags.length > 0
          ? formData.tags
          : [],
        is_active: formData.is_active,
        internal_notes: formData.internal_notes || undefined,
      };

      let activityId = id;

      if (isEdit && id) {
        await activitiesApi.updateActivity(id, data as ActivityUpdate);
      } else {
        const created = await activitiesApi.createActivity(data as ActivityCreate);
        activityId = created.id;
      }

      // Save vibe_tags via gamification API
      if (activityId) {
        try {
          await updateActivityGamification(activityId, {
            vibe_tags: selectedVibes,
          });
        } catch (error: any) {
          console.error('Failed to save vibe tags:', error);
          // Don't fail the whole save if vibe tags fail
        }
      }

      toast.success(isEdit ? 'Activity updated successfully' : 'Activity created successfully');

      if (!isEdit && activityId) {
        navigate(`/activities/${activityId}`);
        return;
      }

      navigate('/activities');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save activity');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canCreate && !isEdit) {
    return (
      <div className="p-6 text-center text-muted">
        You don't have permission to create activities.
      </div>
    );
  }

  if (!canEdit && isEdit) {
    return (
      <div className="p-6 text-center text-muted">
        You don't have permission to edit activities.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const durationUnitOptions = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
    { value: 'nights', label: 'Nights' },
  ];

  const groupSizeOptions = [
    { value: 'Private', label: 'Private' },
    { value: 'Shared', label: 'Shared' },
    { value: '2-4', label: '2-4 people' },
    { value: '2-8', label: '2-8 people' },
    { value: '2-10', label: '2-10 people' },
    { value: 'Max 10', label: 'Max 10 people' },
    { value: 'Max 15', label: 'Max 15 people' },
    { value: 'Max 20', label: 'Max 20 people' },
  ];

  const categoryLabelOptions = [
    { value: 'transfer', label: 'Transfer' },
    { value: 'relaxation', label: 'Relaxation' },
    { value: 'dining', label: 'Dining' },
    { value: 'sightseeing', label: 'Sightseeing' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'culture', label: 'Culture' },
    { value: 'wellness', label: 'Wellness' },
    { value: 'entertainment', label: 'Entertainment' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              {isEdit ? formData.name || 'Edit Activity' : 'New Activity'}
            </h1>
            <p className="text-secondary mt-1">
              {isEdit ? 'Update activity details' : 'Add a new activity to your library'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isEdit && id && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsPreviewModalOpen(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-700">Active</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-4' : ''}`} />
                </div>
              </div>
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Airport Arrival & Private Transfer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type *
                </label>
                <Dropdown
                  options={activityTypes.map((type) => ({
                    value: type.id,
                    label: type.name,
                  }))}
                  value={formData.activity_type_id}
                  onChange={(value) => setFormData({ ...formData, activity_type_id: value })}
                  placeholder="Select activity type"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Label (chip text)
                </label>
                <Dropdown
                  options={categoryLabelOptions}
                  value={formData.category_label}
                  onChange={(value) => setFormData({ ...formData, category_label: value })}
                  placeholder="Select category"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Display
                </label>
                <Input
                  value={formData.location_display}
                  onChange={(e) => setFormData({ ...formData, location_display: e.target.value })}
                  placeholder="e.g., Ngurah Rai International Airport, Bali"
                />
              </div>
            </div>
          </div>

          {/* 2. Descriptions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Descriptions
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description (1-3 lines for lists)
                </label>
                <Textarea
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Brief teaser shown in activity cards and itinerary lists..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client-facing Description (full paragraph for shared view)
                </label>
                <Textarea
                  value={formData.client_description}
                  onChange={(e) => setFormData({ ...formData, client_description: e.target.value })}
                  placeholder="Detailed description shown to clients in the shared itinerary..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* 3. Media Gallery - Only show in edit mode */}
          {isEdit && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Media Gallery
              </h2>

              {/* Upload Area */}
              <div className="mb-4">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Drag & drop images or click to browse
                    </p>
                    <p className="text-xs text-gray-400">
                      JPEG, PNG up to 5MB each (max 6 images)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className={`relative group rounded-lg overflow-hidden border-2 ${
                        image.is_hero || image.is_primary
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={`${baseUrl}${image.file_path}`}
                        alt={`Activity image ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      {(image.is_hero || image.is_primary) && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Hero
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        {!image.is_hero && !image.is_primary && (
                          <button
                            type="button"
                            onClick={() => handleSetHeroImage(image.id)}
                            className="px-2 py-1 bg-white text-xs rounded hover:bg-gray-100"
                          >
                            Set Hero
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.id)}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">
                  No images uploaded yet. Upload images to showcase this activity.
                </p>
              )}
            </div>
          )}

          {/* 4. Timing & Duration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Timing & Duration
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration Value
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.default_duration_value}
                  onChange={(e) => setFormData({ ...formData, default_duration_value: e.target.value })}
                  placeholder="e.g., 45"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration Unit
                </label>
                <Dropdown
                  options={durationUnitOptions}
                  value={formData.default_duration_unit}
                  onChange={(value) => setFormData({ ...formData, default_duration_unit: value })}
                  placeholder="Select unit"
                />
              </div>
            </div>
          </div>

          {/* 5. Experience Meta */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary-600" />
              Experience Meta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (0-5)
                </label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    placeholder="4.9"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Group Size
                </label>
                <Dropdown
                  options={groupSizeOptions}
                  value={formData.group_size_label}
                  onChange={(value) => setFormData({ ...formData, group_size_label: value })}
                  placeholder="Select group size"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Cost Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cost_type"
                      value="included"
                      checked={formData.cost_type === 'included'}
                      onChange={(e) => setFormData({ ...formData, cost_type: e.target.value })}
                      className="text-primary-600"
                    />
                    <span className="text-sm text-green-600 font-medium">Included</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cost_type"
                      value="extra"
                      checked={formData.cost_type === 'extra'}
                      onChange={(e) => setFormData({ ...formData, cost_type: e.target.value })}
                      className="text-primary-600"
                    />
                    <span className="text-sm text-gray-600 font-medium">Extra Cost</span>
                  </label>
                </div>
              </div>

              {formData.cost_type === 'extra' && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Display Text
                  </label>
                  <Input
                    value={formData.cost_display}
                    onChange={(e) => setFormData({ ...formData, cost_display: e.target.value })}
                    placeholder="e.g., From $120 per person"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 6. Highlights */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Highlights
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Add key highlights that will be displayed as chips on the activity card (e.g., "Meet & Greet", "Welcome Drink", "WiFi Available")
            </p>

            {/* Add Highlight Input */}
            <div className="flex gap-2 mb-4">
              <Input
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHighlight();
                  }
                }}
                placeholder="Type a highlight and press Enter"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddHighlight}
                disabled={!newHighlight.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Highlights Chips */}
            <div className="flex flex-wrap gap-2">
              {formData.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm"
                >
                  <span>{highlight}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(index)}
                    className="hover:text-primary-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {formData.highlights.length === 0 && (
                <p className="text-gray-400 text-sm">No highlights added yet</p>
              )}
            </div>
          </div>

          {/* 7. Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Tags & Metadata
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Add tags for filtering and search (e.g., "Family-friendly", "Luxury", "Adventure")
            </p>

            {/* Quick Add Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['Family-friendly', 'Romantic', 'Adventure', 'Luxury', 'Budget', 'Nature', 'Beach', 'Cultural'].map((tag) => (
                !formData.tags.includes(tag) && (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                  >
                    + {tag}
                  </button>
                )
              ))}
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onRemove={() => handleRemoveTag(index)}
                  variant="default"
                  size="sm"
                />
              ))}
              {formData.tags.length === 0 && (
                <p className="text-gray-400 text-sm">No tags added yet</p>
              )}
            </div>
          </div>

          {/* 8. Vibes (for Personalization) */}
          {agencyVibes.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                Vibes (Personalization)
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Select vibes that match this activity. Activities are shown to travelers based on their selected vibes during personalization.
              </p>

              <div className="flex flex-wrap gap-3">
                {agencyVibes.map((vibe) => {
                  const isSelected = selectedVibes.includes(vibe.key);
                  return (
                    <button
                      key={vibe.id}
                      type="button"
                      onClick={() => handleToggleVibe(vibe.key)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{vibe.emoji}</span>
                      <span className="font-medium">{vibe.display_name}</span>
                      {isSelected && (
                        <X className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedVibes.length === 0 && (
                <p className="mt-3 text-sm text-amber-600">
                  No vibes selected. This activity won't appear in personalization decks.
                </p>
              )}
            </div>
          )}

          {/* 9. Internal Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Internal Notes
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Notes visible only to your team, not shown to clients
            </p>
            <Textarea
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              placeholder="Add internal notes, supplier contacts, booking instructions..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 sticky bottom-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/activities')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {isEdit ? 'Update Activity' : 'Create Activity'}
            </Button>
          </div>
        </form>

        {!isEdit && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              After creating the activity, you'll be able to upload images.
            </p>
          </div>
        )}

        {/* Activity Preview Modal */}
        {isEdit && id && (
          <ActivityPreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            activityId={id}
            hideAddButton
          />
        )}
      </div>
    </div>
  );
};

export default ActivityForm;
