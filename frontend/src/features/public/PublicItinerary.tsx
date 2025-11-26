import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import shareApi from '../../api/share';
import { useWebSocket } from '../../hooks/useWebSocket';
import { PublicItineraryResponse, PublicItineraryDay, PublicActivity } from '../../types';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Globe,
  Building,
  Utensils,
  Car,
  Sparkles,
  DollarSign,
  Shield,
  Home
} from 'lucide-react';

const PublicItinerary: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [itinerary, setItinerary] = useState<PublicItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [discountCode, setDiscountCode] = useState('');

  // WebSocket connection for live updates
  const { isConnected, lastMessage } = useWebSocket(
    token || null,
    itinerary?.live_updates_enabled || false
  );

  useEffect(() => {
    if (token) {
      fetchItinerary();
    }
  }, [token]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'itinerary_updated') {
      if (lastMessage.data?.itinerary) {
        setItinerary(lastMessage.data.itinerary);
      } else {
        fetchItinerary();
      }
      setLastUpdated(new Date());
      toast.info('Itinerary updated', { autoClose: 2000 });
    }
  }, [lastMessage]);

  const fetchItinerary = async () => {
    try {
      setIsLoading(true);
      const data = await shareApi.getPublicItinerary(token!);
      setItinerary(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load itinerary');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (dayNumber: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber);
    } else {
      newExpanded.add(dayNumber);
    }
    setExpandedDays(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (value: number | null, unit: string | null) => {
    if (!value) return null;
    const unitLabel = unit === 'minutes' ? 'mins' : unit === 'hours' ? 'hrs' : unit || '';
    return `${value} ${unitLabel}`;
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Itinerary Not Found</h1>
          <p className="text-gray-600">
            This itinerary link may have expired or been removed. Please contact your travel agent for assistance.
          </p>
        </div>
      </div>
    );
  }

  const { trip_overview, company_profile, pricing } = itinerary;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Hero Section - Dark Gradient */}
      <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Live Updates Indicator */}
        {itinerary.live_updates_enabled && (
          <div className="bg-slate-800/50 py-2 px-4">
            <div className="max-w-6xl mx-auto flex items-center justify-end gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-slate-400">
                {isConnected ? 'Live Updates Active' : 'Connecting...'}
              </span>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Welcome Message */}
          <div className="text-center mb-10">
            <p className="text-amber-400 font-medium tracking-widest uppercase text-sm mb-3">
              Welcome Aboard
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              {itinerary.client_name}
            </h1>
            <p className="text-slate-400 text-lg">
              Your personalized journey awaits
            </p>
          </div>

          {/* Trip Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 text-center border border-slate-700/50">
              <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{trip_overview?.total_days || itinerary.days.length}D/{trip_overview?.total_nights || Math.max(0, itinerary.days.length - 1)}N</p>
              <p className="text-slate-400 text-sm">Duration</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 text-center border border-slate-700/50">
              <MapPin className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold truncate">{itinerary.destination}</p>
              <p className="text-slate-400 text-sm">Destination</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 text-center border border-slate-700/50">
              <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {itinerary.num_adults + itinerary.num_children}
              </p>
              <p className="text-slate-400 text-sm">Travellers</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 text-center border border-slate-700/50">
              <Calendar className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-lg font-bold">{formatDate(itinerary.start_date).split(',')[0]}</p>
              <p className="text-slate-400 text-sm">Travel Dates</p>
            </div>
          </div>

          {/* Trip Overview Stats */}
          {trip_overview && (
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {trip_overview.accommodation_count > 0 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>{trip_overview.accommodation_count} Accommodations</span>
                </div>
              )}
              {trip_overview.activity_count > 0 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{trip_overview.activity_count} Activities</span>
                </div>
              )}
              {trip_overview.meal_count > 0 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Utensils className="w-4 h-4 text-amber-400" />
                  <span>{trip_overview.meal_count} Meals</span>
                </div>
              )}
              {trip_overview.transfer_count > 0 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>{trip_overview.transfer_count} Transfers</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Day-by-Day Itinerary */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {itinerary.days.map((day) => (
            <DaySection
              key={day.id}
              day={day}
              isExpanded={expandedDays.has(day.day_number)}
              onToggle={() => toggleDay(day.day_number)}
              baseUrl={baseUrl}
              formatDuration={formatDuration}
            />
          ))}
        </div>
      </main>

      {/* Footer - Company Info & Pricing */}
      <footer className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Company Profile */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                {company_profile?.logo_url ? (
                  <img
                    src={`${baseUrl}${company_profile.logo_url}`}
                    alt={company_profile.company_name || 'Company Logo'}
                    className="w-16 h-16 rounded-xl object-cover bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center">
                    <Building className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold">
                    {company_profile?.company_name || 'Travel Agency'}
                  </h3>
                  {company_profile?.tagline && (
                    <p className="text-amber-400">{company_profile.tagline}</p>
                  )}
                </div>
              </div>

              {company_profile?.description && (
                <p className="text-slate-300 mb-6 leading-relaxed">
                  {company_profile.description}
                </p>
              )}

              <div className="space-y-3">
                {company_profile?.email && (
                  <a
                    href={`mailto:${company_profile.email}`}
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <Mail className="w-5 h-5 text-slate-500" />
                    <span>{company_profile.email}</span>
                  </a>
                )}
                {company_profile?.phone && (
                  <a
                    href={`tel:${company_profile.phone}`}
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <Phone className="w-5 h-5 text-slate-500" />
                    <span>{company_profile.phone}</span>
                  </a>
                )}
                {company_profile?.website_url && (
                  <a
                    href={company_profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <Globe className="w-5 h-5 text-slate-500" />
                    <span>{company_profile.website_url}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Pricing Card */}
            {pricing && (
              <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-6 border border-slate-600/50">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold">Price Summary</h3>
                </div>

                <div className="space-y-4">
                  {pricing.base_package && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Base Package</span>
                      <span className="font-medium">
                        {pricing.currency === 'USD' ? '$' : pricing.currency}
                        {pricing.base_package.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {pricing.taxes_fees && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Taxes & Fees</span>
                      <span className="font-medium">
                        {pricing.currency === 'USD' ? '$' : pricing.currency}
                        {pricing.taxes_fees.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {pricing.discount_amount && pricing.discount_amount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount {pricing.discount_code && `(${pricing.discount_code})`}</span>
                      <span>-${pricing.discount_amount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-600 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">Total</span>
                      <span className="text-3xl font-bold text-amber-400">
                        {pricing.currency === 'USD' ? '$' : pricing.currency}
                        {(pricing.total || itinerary.total_price || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Discount Code Input */}
                  <div className="pt-4">
                    <p className="text-sm text-slate-400 mb-2">Have a discount code?</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="Enter code"
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-lg transition-colors">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Section with QR */}
          {company_profile?.payment_qr_url && (
            <div className="mt-12 border-t border-slate-700 pt-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Confirm?</h3>
                  <p className="text-slate-300 mb-4">
                    Scan the QR code to complete your payment securely. Your booking will be confirmed instantly.
                  </p>
                  {company_profile.payment_note && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Shield className="w-4 h-4" />
                      <span>{company_profile.payment_note}</span>
                    </div>
                  )}
                </div>
                <div className="bg-white p-4 rounded-2xl">
                  <img
                    src={`${baseUrl}${company_profile.payment_qr_url}`}
                    alt="Payment QR Code"
                    className="w-40 h-40"
                  />
                  <p className="text-center text-slate-800 text-sm mt-2 font-medium">
                    Scan to Pay {pricing?.currency === 'USD' ? '$' : pricing?.currency}
                    {(pricing?.total || itinerary.total_price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Powered By */}
          <div className="mt-12 text-center text-slate-500 text-sm">
            <p>Powered by Travel SaaS Itinerary Builder</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Day Section Component
interface DaySectionProps {
  day: PublicItineraryDay;
  isExpanded: boolean;
  onToggle: () => void;
  baseUrl: string;
  formatDuration: (value: number | null, unit: string | null) => string | null;
}

const DaySection: React.FC<DaySectionProps> = ({
  day,
  isExpanded,
  onToggle,
  baseUrl,
  formatDuration
}) => {
  const dayDate = new Date(day.actual_date);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Day Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center text-white">
            <span className="text-xl font-bold">{day.day_number}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Day {day.day_number} {day.title && `- ${day.title}`}
            </h2>
            <p className="text-slate-500">
              {dayDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            {day.activities.length} activit{day.activities.length === 1 ? 'y' : 'ies'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-6 h-6 text-slate-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-slate-400" />
          )}
        </div>
      </button>

      {/* Day Content - Expandable */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          {day.notes && (
            <div className="px-6 py-4 bg-slate-50 text-slate-600 text-sm">
              {day.notes}
            </div>
          )}

          <div className="p-6 space-y-6">
            {day.activities.length === 0 ? (
              <p className="text-center text-slate-400 py-8">
                No activities scheduled for this day
              </p>
            ) : (
              day.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  baseUrl={baseUrl}
                  formatDuration={formatDuration}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Card Component
interface ActivityCardProps {
  activity: PublicActivity;
  baseUrl: string;
  formatDuration: (value: number | null, unit: string | null) => string | null;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  baseUrl,
  formatDuration
}) => {
  const heroImage = activity.images?.find(img => img.is_hero || img.is_primary) || activity.images?.[0];
  const otherImages = activity.images?.filter(img => img !== heroImage).slice(0, 2) || [];
  const duration = formatDuration(activity.default_duration_value, activity.default_duration_unit);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Time slot */}
      {activity.time_slot && (
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-100">
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <span className="text-sm font-medium text-slate-700">{activity.time_slot}</span>
        </div>
      )}

      <div className="md:flex">
        {/* Images */}
        {activity.images && activity.images.length > 0 && (
          <div className="md:w-2/5 p-4">
            <div className="grid grid-cols-3 gap-2 h-48">
              {heroImage && (
                <div className={`${otherImages.length > 0 ? 'col-span-2 row-span-2' : 'col-span-3 row-span-2'} rounded-xl overflow-hidden`}>
                  <img
                    src={`${baseUrl}${heroImage.url}`}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {otherImages.map((img, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden">
                  <img
                    src={`${baseUrl}${img.url}`}
                    alt={`${activity.name} ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`p-6 ${activity.images && activity.images.length > 0 ? 'md:w-3/5' : 'w-full'}`}>
          {/* Category Label */}
          {activity.category_label && (
            <span className="inline-block bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full mb-3">
              {activity.category_label}
            </span>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-slate-800 mb-2">{activity.name}</h3>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {duration}
              </span>
            )}
            {activity.location_display && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {activity.location_display}
              </span>
            )}
          </div>

          {/* Description */}
          {(activity.client_description || activity.short_description) && (
            <p className="text-slate-600 mb-4 leading-relaxed">
              {activity.client_description || activity.short_description}
            </p>
          )}

          {/* Custom Notes */}
          {activity.custom_notes && (
            <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 mb-4 rounded-r-lg">
              <p className="text-sm text-blue-800">{activity.custom_notes}</p>
            </div>
          )}

          {/* Stats Row: Rating, Group Size, Cost */}
          <div className="flex flex-wrap items-center gap-6 py-4 border-t border-b border-slate-100 mb-4">
            {activity.rating && (
              <div className="text-center">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{activity.rating}</span>
                </div>
                <p className="text-xs text-slate-400">Rating</p>
              </div>
            )}
            {activity.group_size_label && (
              <div className="text-center">
                <div className="flex items-center gap-1 font-bold text-slate-700">
                  <Users className="w-4 h-4" />
                  <span>{activity.group_size_label}</span>
                </div>
                <p className="text-xs text-slate-400">Group Size</p>
              </div>
            )}
            <div className="text-center">
              <div className={`font-bold ${activity.cost_type === 'included' ? 'text-green-600' : 'text-slate-700'}`}>
                <DollarSign className="w-4 h-4 inline" />
                {activity.cost_type === 'included' ? 'Included' : activity.cost_display || 'Extra'}
              </div>
              <p className="text-xs text-slate-400">Cost</p>
            </div>
          </div>

          {/* Highlights */}
          {activity.highlights && activity.highlights.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Highlights:</p>
              <div className="flex flex-wrap gap-2">
                {activity.highlights.map((highlight, idx) => (
                  <span
                    key={idx}
                    className="bg-amber-50 text-amber-700 text-sm px-3 py-1 rounded-full"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicItinerary;
