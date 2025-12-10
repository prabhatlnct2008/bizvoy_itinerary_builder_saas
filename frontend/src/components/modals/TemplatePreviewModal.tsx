import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import PublicItinerary from '../../features/public/PublicItinerary';
import { PublicItineraryResponse } from '../../types';
import templatesApi from '../../api/templates';
import { Loader2, AlertCircle } from 'lucide-react';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Template ID to preview */
  templateId: string;
}

// Demo values for template preview
const DEMO_VALUES = {
  client_name: 'John Smith',
  start_date: (() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  })(),
  num_adults: 2,
  num_children: 0,
};

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  templateId,
}) => {
  const [data, setData] = useState<PublicItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && templateId) {
      fetchTemplateData();
    }
  }, [isOpen, templateId]);

  const fetchTemplateData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const template = await templatesApi.getTemplate(templateId);
      const previewData = transformToPublicFormat(template);
      setData(previewData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load template preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate end date based on duration
  const calculateEndDate = (startDate: string, durationDays: number): string => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + durationDays - 1);
    return start.toISOString().split('T')[0];
  };

  // Generate actual dates for days
  const generateActualDate = (startDate: string, dayNumber: number): string => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + dayNumber - 1);
    return start.toISOString().split('T')[0];
  };

  // Transform template to public itinerary format
  const transformToPublicFormat = (template: any): PublicItineraryResponse => {
    const durationDays = template.duration_days || template.days?.length || 1;
    const startDate = DEMO_VALUES.start_date;
    const endDate = calculateEndDate(startDate, durationDays);

    let activityCount = 0;
    let mealCount = 0;
    let transferCount = 0;
    let accommodationCount = 0;

    const days = (template.days || []).map((day: any) => {
      const activities = (day.activities || []).map((act: any) => {
        const itemType = act.item_type || 'LIBRARY_ACTIVITY';

        // Count by type
        if (itemType === 'LIBRARY_ACTIVITY' || itemType === 'CUSTOM_ACTIVITY') {
          activityCount++;
        } else if (itemType === 'LOGISTICS') {
          const title = (act.custom_title || '').toLowerCase();
          if (title.includes('hotel') || title.includes('accommodation') || title.includes('stay')) {
            accommodationCount++;
          } else if (title.includes('meal') || title.includes('lunch') || title.includes('dinner') || title.includes('breakfast')) {
            mealCount++;
          } else {
            transferCount++;
          }
        }

        // Get activity details from nested activity object or directly
        const activity = act.activity || {};

        return {
          id: act.id || `${day.id}-${act.display_order}`,
          itinerary_day_id: day.id,
          activity_id: act.activity_id,
          item_type: itemType,
          custom_title: act.custom_title,
          custom_payload: act.custom_payload,
          custom_icon: act.custom_icon,
          display_order: act.display_order,
          time_slot: act.time_slot,
          custom_notes: act.custom_notes,
          custom_price: act.custom_price,
          start_time: act.start_time,
          end_time: act.end_time,
          is_locked_by_agency: act.is_locked_by_agency || false,
          source_cart_item_id: null,
          added_by_personalization: false,
          // Activity details
          name: activity.name || act.custom_title || 'Untitled',
          activity_type_name: activity.activity_type_name || null,
          category_label: activity.category_label || null,
          location_display: activity.location_display || null,
          short_description: activity.short_description || null,
          client_description: activity.client_description || null,
          default_duration_value: activity.default_duration_value || null,
          default_duration_unit: activity.default_duration_unit || null,
          rating: activity.rating || null,
          group_size_label: activity.group_size_label || null,
          cost_type: activity.cost_type || 'extra',
          cost_display: activity.cost_display || null,
          highlights: activity.highlights ?
            (typeof activity.highlights === 'string' ?
              tryParseJSON(activity.highlights, []) : activity.highlights) : [],
          images: activity.hero_image_url ? [{
            url: activity.hero_image_url,
            is_hero: true,
          }] : [],
        };
      });

      return {
        id: day.id,
        itinerary_id: template.id,
        day_number: day.day_number,
        actual_date: generateActualDate(startDate, day.day_number),
        title: day.title || `Day ${day.day_number}`,
        notes: day.notes,
        activities,
      };
    });

    return {
      id: template.id,
      trip_name: template.name,
      client_name: DEMO_VALUES.client_name,
      destination: template.destination,
      start_date: startDate,
      end_date: endDate,
      num_adults: DEMO_VALUES.num_adults,
      num_children: DEMO_VALUES.num_children,
      status: 'draft',
      total_price: template.approximate_price,
      special_notes: template.description,
      days,
      trip_overview: {
        total_days: durationDays,
        total_nights: Math.max(0, durationDays - 1),
        accommodation_count: accommodationCount,
        activity_count: activityCount,
        meal_count: mealCount,
        transfer_count: transferCount,
      },
      company_profile: null,
      pricing: template.approximate_price ? {
        base_package: template.approximate_price,
        taxes_fees: 0,
        discount_code: null,
        discount_amount: 0,
        total: template.approximate_price,
        currency: 'USD',
      } : null,
      live_updates_enabled: false,
      share_link: {
        id: '',
        itinerary_id: `template-preview-${template.id}`,
        token: '',
        is_active: false,
        expires_at: null,
        view_count: 0,
        created_at: '',
        live_updates_enabled: false,
        last_viewed_at: null,
      },
      personalization_enabled: false,
      personalization_completed: false,
    };
  };

  const tryParseJSON = (str: string, fallback: any): any => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">Loading template preview...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">Preview Unavailable</p>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-500">No data available</p>
        </div>
      );
    }

    return (
      <div>
        {/* Demo Data Notice */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-center text-sm text-blue-700">
          Template Preview - Showing with demo client data ({DEMO_VALUES.client_name}, {DEMO_VALUES.num_adults} adults)
        </div>
        <PublicItinerary data={data} mode="preview" />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Template Preview"
      size="full"
      hideHeader={!isLoading && !error && !!data}
    >
      {renderContent()}
    </Modal>
  );
};

export default TemplatePreviewModal;
