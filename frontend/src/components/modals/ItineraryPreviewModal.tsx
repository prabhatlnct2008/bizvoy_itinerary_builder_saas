import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import PublicItinerary from '../../features/public/PublicItinerary';
import { PublicItineraryResponse } from '../../types';
import shareApi from '../../api/share';
import itinerariesApi from '../../api/itineraries';
import activitiesApi from '../../api/activities';
import { Loader2, AlertCircle } from 'lucide-react';

interface ItineraryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Itinerary ID to preview */
  itineraryId: string;
  /** Optional share token (if already known) */
  shareToken?: string;
}

const ItineraryPreviewModal: React.FC<ItineraryPreviewModalProps> = ({
  isOpen,
  onClose,
  itineraryId,
  shareToken: providedToken,
}) => {
  const [data, setData] = useState<PublicItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  useEffect(() => {
    if (isOpen && itineraryId) {
      fetchPreviewData();
    }
  }, [isOpen, itineraryId, providedToken]);

  const fetchPreviewData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If we have a token, use it directly to get shared view
      if (providedToken) {
        const publicData = await shareApi.getPublicItinerary(providedToken);
        setData(publicData);
        return;
      }

      // Otherwise, fetch the itinerary and transform to preview format
      const itinerary = await itinerariesApi.getItinerary(itineraryId);
      const activityIds: string[] = [];
      (itinerary.days || []).forEach((d: any) =>
        (d.activities || []).forEach((a: any) => {
          if (a.activity_id) activityIds.push(a.activity_id);
        })
      );
      const uniqueIds = Array.from(new Set(activityIds));
      const activityMap: Record<string, any> = {};
      if (uniqueIds.length) {
        const details = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              return await activitiesApi.getActivity(id);
            } catch {
              return null;
            }
          })
        );
        details.forEach((act) => {
          if (act && act.id) {
            activityMap[act.id] = act;
          }
        });
      }

      const previewData = transformToPublicFormat(itinerary, activityMap);
      setData(previewData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Transform itinerary detail to public format (enriched) for preview
  const transformToPublicFormat = (itinerary: any, activityMap: Record<string, any>): PublicItineraryResponse => {
    const normalizeHighlights = (h: any): string[] => {
      if (!h) return [];
      if (Array.isArray(h)) return h;
      if (typeof h === 'string') {
        try {
          const parsed = JSON.parse(h);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          return h.split(',').map((v) => v.trim()).filter(Boolean);
        }
      }
      return [];
    };

    const normalizeImages = (imgs: any[] | undefined) =>
      (imgs || [])
        .map((img) => {
          if (!img) return null;
          const url = img.file_url
            ? (String(img.file_url).startsWith('http') ? img.file_url : `${baseUrl}${img.file_url}`)
            : img.file_path
              ? `${baseUrl}/uploads/${img.file_path}`
              : img.url
                ? (String(img.url).startsWith('http') ? img.url : `${baseUrl}${img.url}`)
                : '';
          return { ...img, url };
        })
        .filter(Boolean);

    const totalDays = itinerary.days?.length || 0;
    let activityCount = 0;
    let mealCount = 0;
    let transferCount = 0;
    let accommodationCount = 0;
    let subtotal = 0;
    let currency = itinerary.currency || itinerary.pricing?.currency || 'USD';

    const days = (itinerary.days || []).map((day: any) => {
      const activities = (day.activities || []).map((act: any) => {
        const fullActivity = act.activity_id ? activityMap[act.activity_id] : null;
        // Count activities by type
        const itemType = act.item_type || 'LIBRARY_ACTIVITY';
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

        // pricing accumulation
        const price =
          act.price_amount ??
          act.custom_price ??
          fullActivity?.price_numeric ??
          null;
        const qty = act.quantity ?? 1;
        const itemDiscount = act.item_discount_amount ?? 0;
        if (price !== null) {
          subtotal += Math.max(price * qty - itemDiscount, 0);
          if (!currency) {
            currency = act.price_currency || fullActivity?.currency_code || 'USD';
          }
        }

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
          added_by_personalization: act.added_by_personalization || false,
          // Activity details
          name: fullActivity?.name || act.activity?.name || act.custom_title || 'Untitled',
          activity_type_name: fullActivity?.activity_type?.name || fullActivity?.activity_type_name || act.activity?.activity_type_name || null,
          category_label: fullActivity?.category_label || act.activity?.category_label || null,
          location_display: fullActivity?.location_display || act.activity?.location_display || null,
          short_description: fullActivity?.short_description || act.activity?.short_description || null,
          client_description: fullActivity?.client_description || act.activity?.client_description || null,
          default_duration_value: fullActivity?.default_duration_value || act.activity?.default_duration_value || null,
          default_duration_unit: fullActivity?.default_duration_unit || act.activity?.default_duration_unit || null,
          rating: fullActivity?.rating || act.activity?.rating || null,
          group_size_label: fullActivity?.group_size_label || act.activity?.group_size_label || act.activity?.group_size || 'Private',
          cost_type: fullActivity?.cost_type || act.activity?.cost_type || 'extra',
          cost_display: fullActivity?.cost_display || act.activity?.cost_display || act.custom_price || act.price_amount || 'Extra',
          highlights: normalizeHighlights(fullActivity?.highlights || act.activity?.highlights),
          images: normalizeImages(fullActivity?.images || act.activity?.images),
        };
      });

      return {
        id: day.id,
        itinerary_id: itinerary.id,
        day_number: day.day_number,
        actual_date: day.actual_date,
        title: day.title,
        notes: day.notes,
        activities,
      };
    });

    return {
      id: itinerary.id,
      trip_name: itinerary.trip_name,
      client_name: itinerary.client_name || 'Guest',
      destination: itinerary.destination,
      start_date: itinerary.start_date,
      end_date: itinerary.end_date,
      num_adults: itinerary.num_adults || 1,
      num_children: itinerary.num_children || 0,
      status: itinerary.status,
      total_price: itinerary.total_price,
      special_notes: itinerary.special_notes,
      days,
      trip_overview: {
        total_days: totalDays,
        total_nights: Math.max(0, totalDays - 1),
        accommodation_count: accommodationCount,
        activity_count: activityCount,
        meal_count: mealCount,
        transfer_count: transferCount,
      },
      company_profile: {
        company_name: itinerary.agency_name || 'Preview Agency',
        tagline: itinerary.agency_tagline || null,
        description: itinerary.agency_description || null,
        logo_url: itinerary.agency_logo ? `${baseUrl}${itinerary.agency_logo}` : null,
        email: itinerary.agency_email || null,
        phone: itinerary.agency_phone || null,
        website_url: itinerary.agency_website || null,
        payment_qr_url: itinerary.payment_qr_url || null,
        payment_note: itinerary.payment_note || null,
      },
      pricing: {
        base_package: subtotal || itinerary.total_price || null,
        taxes_fees: null,
        discount_code: null,
        discount_amount: null,
        total: (subtotal || itinerary.total_price || 0) || null,
        currency,
      },
      live_updates_enabled: false,
      share_link: {
        id: '',
        itinerary_id: itinerary.id,
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">Loading preview...</p>
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

    return <PublicItinerary data={data} mode="preview" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Itinerary Preview"
      size="full"
      hideHeader={!isLoading && !error && !!data}
    >
      {renderContent()}
    </Modal>
  );
};

export default ItineraryPreviewModal;
