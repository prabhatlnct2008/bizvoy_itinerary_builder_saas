import React from 'react';
import {
  Clock,
  MapPin,
  ChevronUp,
  ChevronDown,
  Shield,
  Hotel,
  Car,
  Plane,
  Train,
  Bus,
  Ship,
  Coffee,
  Utensils,
  FileText,
  Briefcase,
  Camera,
  StickyNote,
} from 'lucide-react';
import { PublicActivity, ItemType } from '../../types';
import { ActivityDetailView } from '../activity';

// Icon mapping for logistics items
const LOGISTICS_ICONS: Record<string, React.ElementType> = {
  hotel: Hotel,
  taxi: Car,
  car: Car,
  plane: Plane,
  flight: Plane,
  note: FileText,
  coffee: Coffee,
  meal: Utensils,
  dining: Utensils,
  ship: Ship,
  cruise: Ship,
  train: Train,
  bus: Bus,
  transfer: Bus,
  business: Briefcase,
};

// Extended icon mapping for custom activities
const CUSTOM_ACTIVITY_ICONS: Record<string, React.ElementType> = {
  ...LOGISTICS_ICONS,
  compass: Camera,
  mountain: Camera,
  waves: Camera,
  landmark: Camera,
  camera: Camera,
  utensils: Utensils,
  shopping: Camera,
  music: Camera,
  bike: Camera,
  palmtree: Camera,
};

const getLogisticsIcon = (iconHint?: string | null, itemType?: ItemType): React.ElementType => {
  if (iconHint) {
    const key = iconHint.toLowerCase();
    if (LOGISTICS_ICONS[key]) return LOGISTICS_ICONS[key];
    if (CUSTOM_ACTIVITY_ICONS[key]) return CUSTOM_ACTIVITY_ICONS[key];
  }
  // Default based on item type
  if (itemType === 'NOTE') return StickyNote;
  if (itemType === 'CUSTOM_ACTIVITY') return Camera;
  return Car; // Default for LOGISTICS
};

interface ActivityCardProps {
  activity: PublicActivity;
  isExpanded: boolean;
  onToggle: () => void;
  baseUrl: string;
  formatDuration: (value: number | null, unit: string | null) => string | null;
  isLast: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isExpanded,
  onToggle,
  baseUrl,
  formatDuration,
  isLast,
}) => {
  const itemType: ItemType = (activity.item_type as ItemType) || 'LIBRARY_ACTIVITY';
  const isAdHocItem = itemType === 'LOGISTICS' || itemType === 'NOTE' || itemType === 'CUSTOM_ACTIVITY';

  const duration = formatDuration(activity.default_duration_value, activity.default_duration_unit);

  // Get time display - prefer start_time/end_time over time_slot
  const getTimeDisplay = () => {
    if (activity.start_time && activity.end_time) {
      return `${activity.start_time} - ${activity.end_time}`;
    }
    if (activity.start_time) {
      return activity.start_time;
    }
    return activity.time_slot || '—';
  };

  const normalizeImages = (imgs: any[] | undefined) => {
    return (imgs || [])
      .map((img) => {
        if (!img) return null;
        const url = img.url
          ? String(img.url).startsWith('http')
            ? img.url
            : `${baseUrl}${img.url}`
          : img.file_path
          ? `${baseUrl}/uploads/${img.file_path}`
          : '';
        return { ...img, url };
      })
      .filter(Boolean) as any[];
  };

  const images = normalizeImages(activity.images);
  const heroImage = images.find((img) => img.is_hero) || images[0];

  // Category styling
  const getCategoryStyle = (category: string | null) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('logistics')) {
      return 'bg-amber-100 text-amber-700';
    }
    if (cat.includes('note')) {
      return 'bg-blue-100 text-blue-700';
    }
    if (cat.includes('transfer') || cat.includes('transport')) {
      return 'bg-slate-100 text-slate-600';
    }
    if (cat.includes('relax') || cat.includes('spa') || cat.includes('wellness')) {
      return 'bg-teal-50 text-teal-600';
    }
    if (cat.includes('dining') || cat.includes('meal') || cat.includes('food')) {
      return 'bg-blue-50 text-blue-600';
    }
    if (cat.includes('sightseeing') || cat.includes('tour')) {
      return 'bg-slate-100 text-slate-600';
    }
    if (cat.includes('culture') || cat.includes('temple') || cat.includes('museum')) {
      return 'bg-orange-50 text-orange-600';
    }
    if (cat.includes('adventure') || cat.includes('sport') || cat.includes('trek')) {
      return 'bg-rose-50 text-rose-600';
    }
    return 'bg-slate-100 text-slate-600';
  };

  // Render Logistics/Note item (simplified card)
  if (isAdHocItem) {
    const IconComponent = getLogisticsIcon(activity.custom_icon, itemType);

    return (
      <div className="flex gap-4 mb-6">
        {/* Timeline Column */}
        <div className="flex flex-col items-center w-16 flex-shrink-0">
          {/* Time Circle */}
          <div className="w-14 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-xs font-medium text-slate-600">{getTimeDisplay()}</span>
          </div>
          {/* Connector Line */}
          {!isLast && (
            <div className="flex-1 w-px bg-slate-200 mt-2" style={{ minHeight: '80px' }}></div>
          )}
        </div>

        {/* Logistics/Note/Custom Activity Content - Simpler Card */}
        <div
          className={`flex-1 rounded-xl border shadow-sm overflow-hidden ${
            itemType === 'LOGISTICS'
              ? 'bg-amber-50 border-amber-200'
              : itemType === 'NOTE'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="p-4 flex items-center gap-4">
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                itemType === 'LOGISTICS'
                  ? 'bg-amber-100 text-amber-600'
                  : itemType === 'NOTE'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              <IconComponent className="w-6 h-6" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Type Badge */}
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${
                  itemType === 'LOGISTICS'
                    ? 'bg-amber-100 text-amber-700'
                    : itemType === 'NOTE'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {itemType === 'LOGISTICS' ? 'Logistics' : itemType === 'NOTE' ? 'Note' : 'Custom Activity'}
              </span>

              {/* Title */}
              <h4 className="text-slate-900 font-semibold">{activity.custom_title || activity.name}</h4>

              {/* Notes/Details */}
              {activity.custom_notes && (
                <p className="text-sm text-slate-600 mt-1">{activity.custom_notes}</p>
              )}
            </div>

            {/* Lock indicator if agency-locked */}
            {activity.is_locked_by_agency && (
              <div className="flex-shrink-0">
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Library Activity (full card)
  return (
    <div className="flex gap-4 mb-6">
      {/* Timeline Column */}
      <div className="flex flex-col items-center w-16 flex-shrink-0">
        {/* Time Circle */}
        <div className="w-14 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <span className="text-xs font-medium text-slate-600">{getTimeDisplay()}</span>
        </div>
        {/* Connector Line */}
        {!isLast && (
          <div className="flex-1 w-px bg-slate-200 mt-2" style={{ minHeight: '120px' }}></div>
        )}
      </div>

      {/* Activity Content */}
      <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header Row - Always Visible */}
        <div
          onClick={onToggle}
          className="p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          {/* Thumbnail */}
          {heroImage && (
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img src={heroImage.url} alt={activity.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            {activity.category_label && (
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${getCategoryStyle(
                  activity.category_label
                )}`}
              >
                {activity.category_label.toLowerCase()}
              </span>
            )}

            {/* Personalization Badge */}
            {activity.added_by_personalization && (
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ml-1 bg-emerald-100 text-emerald-700">
                personalized
              </span>
            )}

            {/* Title */}
            <h4 className="text-slate-900 font-semibold">{activity.name}</h4>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {duration}
                </span>
              )}
              {activity.location_display && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activity.location_display}
                </span>
              )}
            </div>
          </div>

          {/* Expand Chevron */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
        </div>

        {/* Expanded Content - Using shared ActivityDetailView */}
        {isExpanded && (
          <div className="px-5 pb-5 pt-4 border-t border-slate-100">
            <ActivityDetailView
              activity={{
                id: activity.id,
                name: activity.name,
                category_label: activity.category_label,
                location_display: activity.location_display,
                short_description: activity.short_description,
                client_description: activity.client_description,
                default_duration_value: activity.default_duration_value,
                default_duration_unit: activity.default_duration_unit,
                rating: activity.rating,
                group_size_label: activity.group_size_label,
                cost_type: activity.cost_type,
                cost_display: activity.cost_display,
                highlights: activity.highlights,
                images: images,
                custom_notes: activity.custom_notes,
                added_by_personalization: activity.added_by_personalization,
              }}
              baseUrl={baseUrl}
              variant="full"
              showImages={true}
              hideHeader={true}
              isPersonalized={activity.added_by_personalization}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
