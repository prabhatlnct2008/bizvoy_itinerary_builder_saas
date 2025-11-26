import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Dropdown from '../../components/ui/Dropdown';
import TagsInput from '../../components/ui/TagsInput';
import { usePermissions } from '../../hooks/usePermissions';
import activitiesApi from '../../api/activities';
import activityTypesApi from '../../api/activityTypes';
import { ActivityType, ActivityCreate, ActivityUpdate, ActivityImage } from '../../types';

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

  const [formData, setFormData] = useState({
    name: '',
    activity_type_id: '',
    location: '',
    short_description: '',
    description: '',
    highlights: '',
    base_price: '',
    pricing_model: '',
    pricing_notes: '',
    min_duration_minutes: '',
    max_duration_minutes: '',
    tags: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    fetchActivityTypes();
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

  const fetchActivity = async (activityId: string) => {
    try {
      setIsLoading(true);
      const data = await activitiesApi.getActivity(activityId);
      setImages(data.images || []);

      // Parse tags from JSON string
      let parsedTags: string[] = [];
      if (data.tags) {
        try {
          parsedTags = JSON.parse(data.tags);
        } catch {
          parsedTags = [];
        }
      }

      setFormData({
        name: data.name,
        activity_type_id: data.activity_type_id || '',
        location: data.location || '',
        short_description: data.short_description || '',
        description: data.description || '',
        highlights: data.highlights || '',
        base_price: data.base_price?.toString() || '',
        pricing_model: data.pricing_model || '',
        pricing_notes: data.pricing_notes || '',
        min_duration_minutes: data.min_duration_minutes?.toString() || '',
        max_duration_minutes: data.max_duration_minutes?.toString() || '',
        tags: parsedTags,
        is_active: data.is_active,
      });
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

  const handleSetPrimaryImage = async (imageId: string) => {
    // In a real implementation, you'd call an API to set primary image
    // For now, we'll just update the local state
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_primary: img.id === imageId,
      }))
    );
    toast.success('Primary image updated');
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
        location: formData.location || undefined,
        short_description: formData.short_description || undefined,
        description: formData.description || undefined,
        highlights: formData.highlights || undefined,
        base_price: formData.base_price ? parseFloat(formData.base_price) : undefined,
        pricing_model: formData.pricing_model || undefined,
        pricing_notes: formData.pricing_notes || undefined,
        min_duration_minutes: formData.min_duration_minutes ? parseInt(formData.min_duration_minutes) : undefined,
        max_duration_minutes: formData.max_duration_minutes ? parseInt(formData.max_duration_minutes) : undefined,
        tags: formData.tags.length > 0 ? JSON.stringify(formData.tags) : undefined,
        is_active: formData.is_active,
      };

      if (isEdit && id) {
        await activitiesApi.updateActivity(id, data as ActivityUpdate);
        toast.success('Activity updated successfully');
      } else {
        const created = await activitiesApi.createActivity(data as ActivityCreate);
        toast.success('Activity created successfully');
        // After creation, navigate to edit mode so user can upload images
        navigate(`/activities/${created.id}`);
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

  const pricingModelOptions = [
    { value: 'per_person', label: 'Per Person' },
    { value: 'per_night', label: 'Per Night' },
    { value: 'per_activity', label: 'Per Activity' },
    { value: 'flat_package', label: 'Flat Package' },
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
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
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Active</span>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 2N at Lakeside Resort (Deluxe Room)"
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
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Munnar, Kerala or Downtown Paris"
                />
              </div>
            </div>
          </div>

          {/* 2. Descriptions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Descriptions</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description (1-3 lines)
                </label>
                <Textarea
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Brief teaser shown in lists and itineraries..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Highlights / Inclusions
                </label>
                <Textarea
                  value={formData.highlights}
                  onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                  placeholder="Enter each highlight on a new line:&#10;• 2 nights in Deluxe Room&#10;• Daily breakfast included&#10;• Lake-facing balcony"
                  rows={6}
                />
                <p className="mt-1 text-xs text-gray-500">Use bullet points, one per line</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description (Optional)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional detailed information about the activity..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* 3. Media (Images) - Only show in edit mode */}
          {isEdit && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Media</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload one or more images. Mark one as primary for use in cards.
                  </p>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={`http://localhost:8000${image.file_path}`}
                          alt={image.caption || ''}
                          className={`w-full h-32 object-cover rounded-md ${
                            image.is_primary ? 'ring-2 ring-primary-500' : ''
                          }`}
                        />
                        {image.is_primary && (
                          <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-md flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          {!image.is_primary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(image.id)}
                              className="px-2 py-1 bg-white text-xs rounded hover:bg-gray-100"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(image.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pricing Model
                  </label>
                  <Dropdown
                    options={pricingModelOptions}
                    value={formData.pricing_model}
                    onChange={(value) => setFormData({ ...formData, pricing_model: value })}
                    placeholder="Select pricing model"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Notes
                </label>
                <Input
                  value={formData.pricing_notes}
                  onChange={(e) => setFormData({ ...formData, pricing_notes: e.target.value })}
                  placeholder='e.g., "Taxes extra", "Price varies by season"'
                />
              </div>
            </div>
          </div>

          {/* 5. Tags & Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tags & Metadata</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <TagsInput
                  tags={formData.tags}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                  placeholder="e.g., Family-friendly, Romantic, Adventure"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Add tags like "Luxury", "Adventure", "Family-friendly" for better filtering
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    value={formData.min_duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, min_duration_minutes: e.target.value })
                    }
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    value={formData.max_duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, max_duration_minutes: e.target.value })
                    }
                    placeholder="120"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/activities')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEdit ? 'Update Activity' : 'Create Activity'}
            </Button>
          </div>
        </form>

        {!isEdit && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              💡 Tip: After creating the activity, you'll be able to upload images.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityForm;
