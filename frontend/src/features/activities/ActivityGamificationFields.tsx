import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Input from '../../components/ui/Input';
import { getAgencyVibes } from '../../api/gamification';

interface Vibe {
  id: string;
  key: string;
  display_name: string;
  emoji: string;
  enabled: boolean;
}

interface GamificationData {
  price?: number | null;
  currency?: string;
  marketing_badge?: string | null;
  vibe_tags?: string[];
  optimal_time_of_day?: string | null;
  blocked_days?: string[];
  latitude?: number | null;
  longitude?: number | null;
  review_count?: number | null;
  rating?: number | null;
}

interface ActivityGamificationFieldsProps {
  value: GamificationData;
  onChange: (data: GamificationData) => void;
}

const MARKETING_BADGES = [
  { value: '', label: 'None' },
  { value: 'popular', label: 'Popular' },
  { value: 'selling_fast', label: 'Selling Fast' },
  { value: 'small_group', label: 'Small Group' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'new', label: 'New' },
];

const TIMES_OF_DAY = [
  { value: '', label: 'Any' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
];

const DAYS_OF_WEEK = [
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
];

const ActivityGamificationFields: React.FC<ActivityGamificationFieldsProps> = ({
  value,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loadingVibes, setLoadingVibes] = useState(true);

  useEffect(() => {
    loadVibes();
  }, []);

  const loadVibes = async () => {
    try {
      setLoadingVibes(true);
      const data = await getAgencyVibes();
      setVibes(data.filter((v: Vibe) => v.enabled));
    } catch (error) {
      console.error('Failed to load vibes:', error);
    } finally {
      setLoadingVibes(false);
    }
  };

  const handleChange = (field: keyof GamificationData, val: any) => {
    onChange({ ...value, [field]: val });
  };

  const toggleVibeTag = (vibeKey: string) => {
    const current = value.vibe_tags || [];
    const updated = current.includes(vibeKey)
      ? current.filter((v) => v !== vibeKey)
      : [...current, vibeKey];
    handleChange('vibe_tags', updated);
  };

  const toggleBlockedDay = (day: string) => {
    const current = value.blocked_days || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    handleChange('blocked_days', updated);
  };

  return (
    <div className="border border-border rounded-lg">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text-primary">
            Gamification Settings
          </h3>
          <span className="text-sm text-text-muted">
            (Optional - enhances discovery engine)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-6">
          {/* Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Price Per Person
              </label>
              <Input
                type="number"
                step="0.01"
                value={value.price || ''}
                onChange={(e) =>
                  handleChange('price', e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Currency
              </label>
              <select
                value={value.currency || 'USD'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          {/* Marketing Badge */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Marketing Badge
            </label>
            <select
              value={value.marketing_badge || ''}
              onChange={(e) => handleChange('marketing_badge', e.target.value || null)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {MARKETING_BADGES.map((badge) => (
                <option key={badge.value} value={badge.value}>
                  {badge.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vibe Tags */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Vibe Tags
            </label>
            {loadingVibes ? (
              <div className="text-sm text-text-muted">Loading vibes...</div>
            ) : vibes.length === 0 ? (
              <div className="text-sm text-text-muted">
                No vibes configured. Configure vibes in settings.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vibes.map((vibe) => (
                  <button
                    key={vibe.id}
                    type="button"
                    onClick={() => toggleVibeTag(vibe.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                      (value.vibe_tags || []).includes(vibe.key)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-primary-300'
                    }`}
                  >
                    <span className="text-xl">{vibe.emoji}</span>
                    <span className="text-sm font-medium">{vibe.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optimal Time of Day */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Optimal Time of Day
            </label>
            <div className="flex gap-2">
              {TIMES_OF_DAY.map((time) => (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => handleChange('optimal_time_of_day', time.value || null)}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    (value.optimal_time_of_day || '') === time.value
                      ? 'border-primary-500 bg-primary-50 font-medium'
                      : 'border-border hover:border-primary-300'
                  }`}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blocked Days */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Blocked Days (Not Available)
            </label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggleBlockedDay(day.key)}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                    (value.blocked_days || []).includes(day.key)
                      ? 'border-red-500 bg-red-50 text-red-700 font-medium'
                      : 'border-border hover:border-primary-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Latitude
              </label>
              <Input
                type="number"
                step="0.000001"
                value={value.latitude || ''}
                onChange={(e) =>
                  handleChange('latitude', e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="e.g., 40.7128"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Longitude
              </label>
              <Input
                type="number"
                step="0.000001"
                value={value.longitude || ''}
                onChange={(e) =>
                  handleChange('longitude', e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="e.g., -74.0060"
              />
            </div>
          </div>

          {/* Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Review Count
              </label>
              <Input
                type="number"
                value={value.review_count || ''}
                onChange={(e) =>
                  handleChange('review_count', e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="e.g., 150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Average Rating (0-5)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={value.rating || ''}
                onChange={(e) =>
                  handleChange('rating', e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="e.g., 4.5"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityGamificationFields;
