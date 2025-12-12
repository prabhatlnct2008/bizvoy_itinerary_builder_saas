import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Star,
  Users,
  DollarSign,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface ActivityDetailData {
  id?: string;
  name: string;
  category_label?: string | null;
  location_display?: string | null;
  short_description?: string | null;
  client_description?: string | null;
  default_duration_value?: number | null;
  default_duration_unit?: string | null;
  rating?: number | null;
  group_size_label?: string | null;
  cost_type?: string | null;
  cost_display?: string | null;
  highlights?: string | string[] | null;
  tags?: string | string[] | null;
  images?: Array<{
    url?: string;
    file_path?: string;
    file_url?: string;
    is_hero?: boolean;
    is_primary?: boolean;
  }>;
  // Additional fields for public view
  custom_notes?: string | null;
  added_by_personalization?: boolean;
}

interface ActivityDetailViewProps {
  activity: ActivityDetailData;
  /** Base URL for images (without trailing slash) */
  baseUrl?: string;
  /** Variant: 'full' shows everything, 'compact' shows less */
  variant?: 'full' | 'compact';
  /** Whether to show the image carousel */
  showImages?: boolean;
  /** Hide the category/name header (useful when shown elsewhere) */
  hideHeader?: boolean;
  /** Custom notes to show at the bottom */
  customNotes?: string | null;
  /** Whether this is a personalized activity */
  isPersonalized?: boolean;
  /** Additional className for the container */
  className?: string;
}

const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({
  activity,
  baseUrl = '',
  variant = 'full',
  showImages = true,
  hideHeader = false,
  customNotes,
  isPersonalized,
  className = '',
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatDuration = (value: number | null | undefined, unit: string | null | undefined) => {
    if (!value) return null;
    if (unit === 'minutes') return `${value} mins`;
    if (unit === 'hours') return value === 1 ? '1 hour' : `${value} hours`;
    return `${value} ${unit || ''}`;
  };

  const getImageUrl = (img: { file_path?: string; file_url?: string; url?: string }) => {
    if (img.url) {
      return img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`;
    }
    if (img.file_url) {
      return img.file_url.startsWith('http') ? img.file_url : `${baseUrl}${img.file_url}`;
    }
    if (img.file_path) {
      return `${baseUrl}/uploads/${img.file_path}`;
    }
    return '';
  };

  const parseHighlights = (highlights: string | string[] | null | undefined): string[] => {
    if (!highlights) return [];
    if (Array.isArray(highlights)) return highlights.filter(Boolean);
    try {
      const parsed = JSON.parse(highlights);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // fall through to comma split
    }
    return highlights.split(',').map((h) => h.trim()).filter(Boolean);
  };

  const parseTags = (tags: string | string[] | null | undefined): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.filter(Boolean);
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // fall through to comma split
    }
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activity.images?.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? activity.images!.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activity.images?.length) return;
    setCurrentImageIndex((prev) => (prev === activity.images!.length - 1 ? 0 : prev + 1));
  };

  const images = activity.images || [];
  const currentImage = images[currentImageIndex];
  const highlights = parseHighlights(activity.highlights);
  const tags = parseTags(activity.tags);
  const duration = formatDuration(activity.default_duration_value, activity.default_duration_unit);

  const isCompact = variant === 'compact';

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Image Carousel */}
      {showImages && images.length > 0 && currentImage && (
        <div className="relative">
          <div className={`${isCompact ? 'aspect-[16/9] max-h-[200px]' : 'aspect-video'} rounded-xl overflow-hidden bg-slate-100`}>
            <img
              src={getImageUrl(currentImage)}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category & Name - Only in full variant and when not hidden */}
      {!isCompact && !hideHeader && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            {activity.category_label && (
              <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                {activity.category_label}
              </span>
            )}
            {(isPersonalized || activity.added_by_personalization) && (
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                personalized
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{activity.name}</h2>
        </div>
      )}

      {/* Meta Info Row */}
      <div className={`flex flex-wrap gap-3 text-sm text-slate-600 ${isCompact ? 'gap-2' : ''}`}>
        {duration && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{duration}</span>
          </div>
        )}
        {activity.location_display && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{activity.location_display}</span>
          </div>
        )}
        {activity.rating && (
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{activity.rating}</span>
          </div>
        )}
        {activity.group_size_label && !isCompact && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{activity.group_size_label}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {(activity.client_description || activity.short_description) && (
        <p className="text-slate-600 leading-relaxed text-sm">
          {activity.client_description || activity.short_description}
        </p>
      )}

      {/* Stats Row */}
      <div className="bg-slate-50 rounded-xl p-5 grid grid-cols-3 gap-4">
        {/* Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Star className={`w-4 h-4 ${activity.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
            <span className={`font-semibold ${activity.rating ? 'text-amber-500' : 'text-slate-400'}`}>
              {activity.rating || '-'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Rating</p>
        </div>

        {/* Group Size */}
        <div className="text-center border-x border-slate-200">
          <div className="flex items-center justify-center gap-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 text-xs">
              {activity.group_size_label || 'Private'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Group Size</p>
        </div>

        {/* Cost */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <DollarSign className={`w-4 h-4 ${activity.cost_type === 'included' ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className={`font-semibold text-xs ${activity.cost_type === 'included' ? 'text-emerald-500' : 'text-slate-700'}`}>
              {activity.cost_type === 'included' ? 'Included' : activity.cost_display || 'Extra'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Cost</p>
        </div>
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Highlights</h3>
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm rounded-lg"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags - Only in full variant */}
      {!isCompact && tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom Notes */}
      {(customNotes || activity.custom_notes) && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
          <p className="text-sm text-blue-800">{customNotes || activity.custom_notes}</p>
        </div>
      )}
    </div>
  );
};

export default ActivityDetailView;
