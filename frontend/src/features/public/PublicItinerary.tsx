import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import shareApi from '../../api/share';
import { useWebSocket } from '../../hooks/useWebSocket';
import { PublicItineraryResponse, PublicItineraryDay, PublicActivity } from '../../types';
import { PersonalizationEntry } from '../personalization/components/PersonalizationEntry';
import { ActivityDetailView } from '../../components/activity';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
  Globe,
  Building2,
  Utensils,
  Car,
  Sparkles,
  Shield,
  Hotel,
  Camera,
  Plane,
  Train,
  Bus,
  Ship,
  Coffee,
  FileText,
  Briefcase,
  StickyNote
} from 'lucide-react';
import { ItemType } from '../../types';

export interface PublicItineraryProps {
  /** Optional data to render directly (skips API fetch) */
  data?: PublicItineraryResponse;
  /** Mode: 'public' shows personalization CTA, 'preview' hides it */
  mode?: 'public' | 'preview';
  /** Optional token override (for when data is not provided) */
  shareToken?: string;
}

const PublicItinerary: React.FC<PublicItineraryProps> = ({
  data: providedData,
  mode = 'public',
  shareToken,
}) => {
  const { token: urlToken } = useParams<{ token: string }>();
  const token = shareToken || urlToken;
  const isPreviewMode = mode === 'preview';

  const [itinerary, setItinerary] = useState<PublicItineraryResponse | null>(providedData || null);
  const [isLoading, setIsLoading] = useState(!providedData);
  const [, setLastUpdated] = useState<Date | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [discountCode, setDiscountCode] = useState('');

  // Only use WebSocket in public mode with token
  const { isConnected, lastMessage } = useWebSocket(
    !isPreviewMode && token ? token : null,
    !isPreviewMode && itinerary?.live_updates_enabled || false
  );

  // Update itinerary when providedData changes
  useEffect(() => {
    if (providedData) {
      setItinerary(providedData);
      setIsLoading(false);
      // Auto-expand first day
      if (providedData.days.length > 0) {
        setExpandedDays(new Set([1]));
        if (providedData.days[0].activities.length > 0) {
          setExpandedActivities(new Set([providedData.days[0].activities[0].id]));
        }
      }
    }
  }, [providedData]);

  // Only fetch if no data provided and we have a token
  useEffect(() => {
    if (!providedData && token) {
      fetchItinerary();
    }
  }, [token, providedData]);

  useEffect(() => {
    if (!isPreviewMode && lastMessage && lastMessage.type === 'itinerary_updated') {
      if (lastMessage.data?.itinerary) {
        setItinerary(lastMessage.data.itinerary);
      } else {
        fetchItinerary();
      }
      setLastUpdated(new Date());
      toast.info('Itinerary updated', { autoClose: 2000 });
    }
  }, [lastMessage, isPreviewMode]);

  const fetchItinerary = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await shareApi.getPublicItinerary(token);
      setItinerary(data);
      // Auto-expand first day and its first activity
      if (data.days.length > 0) {
        setExpandedDays(new Set([1]));
        if (data.days[0].activities.length > 0) {
          setExpandedActivities(new Set([data.days[0].activities[0].id]));
        }
      }
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

  const toggleActivity = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  };

  const formatDuration = (value: number | null, unit: string | null) => {
    if (!value) return null;
    if (unit === 'minutes') return `${value} mins`;
    if (unit === 'hours') return value === 1 ? '1 hour' : `${value} hours`;
    return `${value} ${unit || ''}`;
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Itinerary Not Found</h1>
          <p className="text-slate-600">
            This itinerary link may have expired or been removed. Please contact your travel agent for assistance.
          </p>
        </div>
      </div>
    );
  }

  const { trip_overview, company_profile, pricing } = itinerary;

  const formatPrice = (amount?: number | null, currency?: string) => {
    const value = amount ?? 0;
    const curr = currency || pricing?.currency || itinerary.total_price_currency || 'USD';
    return `${curr} ${value.toLocaleString()}`;
  };
  const nameParts = itinerary?.client_name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium">
          Preview Mode - This is how your itinerary will appear to clients
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">

        {/* Live Updates Indicator - Hidden in preview mode */}
        {!isPreviewMode && itinerary.live_updates_enabled && (
          <div className="flex items-center justify-end gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-slate-500">
              {isConnected ? 'Live Updates Active' : 'Connecting...'}
            </span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            HERO SECTION
            ══════════════════════════════════════════════════════════════ */}
        <section className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {/* Decorative plane icon */}
          <div className="absolute top-8 right-8 w-16 h-16 rounded-full border-2 border-amber-400/30 flex items-center justify-center">
            <Plane className="w-7 h-7 text-amber-400 rotate-45" />
          </div>

          {/* Welcome Label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px bg-amber-400"></div>
            <span className="text-amber-400 text-xs font-semibold tracking-[0.2em] uppercase">
              Welcome Aboard
            </span>
          </div>

          {/* Main Greeting */}
          <h1 className="text-4xl md:text-5xl font-light text-white mb-3">
            Hello, <span className="font-bold">{firstName} {lastName}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-base md:text-lg max-w-xl mb-8">
            Your journey to <span className="text-white font-medium">{itinerary.destination}</span> awaits.
            Here's everything you need for an unforgettable adventure.
          </p>

          {/* Info Pills */}
          <div className="flex flex-wrap gap-3">
            {/* Duration */}
            <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Duration</p>
                <p className="text-white font-semibold">
                  {trip_overview?.total_days || itinerary.days.length} Days / {trip_overview?.total_nights || Math.max(0, itinerary.days.length - 1)} Nights
                </p>
              </div>
            </div>

            {/* Destination */}
            <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Destination</p>
                <p className="text-white font-semibold">{itinerary.destination}</p>
              </div>
            </div>

            {/* Travelers */}
            <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Travelers</p>
                <p className="text-white font-semibold">
                  {itinerary.num_adults + itinerary.num_children} Guest{itinerary.num_adults + itinerary.num_children !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Travel Dates */}
            <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Travel Dates</p>
                <p className="text-white font-semibold">
                  {formatDateRange(itinerary.start_date, itinerary.end_date)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            TRIP OVERVIEW SECTION
            ══════════════════════════════════════════════════════════════ */}
        {trip_overview && (
          <section>
            {/* Section Header with Lines */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <h2 className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Trip Overview
              </h2>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trip_overview.accommodation_count > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4">
                    <Hotel className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{trip_overview.accommodation_count}</p>
                  <p className="text-sm text-slate-500">Accommodations</p>
                </div>
              )}

              {trip_overview.activity_count > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mb-4">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{trip_overview.activity_count}</p>
                  <p className="text-sm text-slate-500">Activities</p>
                </div>
              )}

              {trip_overview.meal_count > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mb-4">
                    <Utensils className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{trip_overview.meal_count}</p>
                  <p className="text-sm text-slate-500">Meals Included</p>
                </div>
              )}

              {trip_overview.transfer_count > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center mb-4">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{trip_overview.transfer_count}</p>
                  <p className="text-sm text-slate-500">Transfers</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PERSONALIZED BADGE (shown when personalization was done)
            Hidden in preview mode
            ══════════════════════════════════════════════════════════════ */}
        {!isPreviewMode && itinerary.personalization_completed && (
          <section>
            <div className="bg-gradient-to-r from-game-accent-green to-game-accent-coral rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-white">
                <Sparkles className="w-6 h-6" />
                <span className="text-lg font-bold">This trip has been personalized for you!</span>
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MAKE THIS TRIP YOURS SECTION - always show when enabled
            (deck will filter out activities already in itinerary)
            Hidden in preview mode
            ══════════════════════════════════════════════════════════════ */}
        {!isPreviewMode && itinerary.personalization_enabled && token && (
          <section className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 md:p-8 border border-slate-200">
            {/* Section Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {itinerary.personalization_completed ? 'Add more experiences' : 'Make this trip yours'}
              </h2>
              <p className="text-slate-600 max-w-lg mx-auto">
                {itinerary.personalization_completed
                  ? 'Discover more activities to add to your personalized itinerary.'
                  : 'Personalize your itinerary by swiping through curated experiences. It only takes 60 seconds to create your perfect trip.'}
              </p>
            </div>

            {/* Personalization Entry CTA */}
            <PersonalizationEntry token={token} />
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            YOUR ITINERARY SECTION
            ══════════════════════════════════════════════════════════════ */}
        <section>
          {/* Section Header with Lines */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <h2 className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
              Your Itinerary
            </h2>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Day Cards */}
          <div className="space-y-6">
            {itinerary.days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                isExpanded={expandedDays.has(day.day_number)}
                onToggle={() => toggleDay(day.day_number)}
                expandedActivities={expandedActivities}
                toggleActivity={toggleActivity}
                baseUrl={baseUrl}
                formatDuration={formatDuration}
                formatDateFull={formatDateFull}
                showPersonalizationLink={itinerary.personalization_enabled && !itinerary.personalization_completed}
                personalizationToken={token}
              />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FOOTER / BOOKING SECTION
            ══════════════════════════════════════════════════════════════ */}
        <section className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Left Column - Company Info */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                {company_profile?.logo_url ? (
                  <img
                    src={`${baseUrl}${company_profile.logo_url}`}
                    alt={company_profile.company_name || 'Company'}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {company_profile?.company_name || 'Travel Agency'}
                  </h3>
                  {company_profile?.tagline && (
                    <p className="text-amber-400 text-sm">{company_profile.tagline}</p>
                  )}
                </div>
              </div>

              {company_profile?.description && (
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  {company_profile.description}
                </p>
              )}

              {/* Contact Info */}
              <div className="space-y-3">
                {company_profile?.email && (
                  <a href={`mailto:${company_profile.email}`} className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <span className="text-sm">{company_profile.email}</span>
                  </a>
                )}
                {company_profile?.phone && (
                  <a href={`tel:${company_profile.phone}`} className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="text-sm">{company_profile.phone}</span>
                  </a>
                )}
                {company_profile?.website_url && (
                  <a href={company_profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <span className="text-sm">{company_profile.website_url}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column - Price Summary */}
            {pricing && (
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-slate-900">Price Summary</h4>
                </div>

                <div className="space-y-3 mb-4">
                  {pricing.base_package !== undefined && pricing.base_package !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Base Package</span>
                      <span className="text-slate-900 font-medium">
                        {formatPrice(pricing.base_package, pricing.currency)}
                      </span>
                    </div>
                  )}
                  {pricing.taxes_fees !== undefined && pricing.taxes_fees > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Taxes & Fees</span>
                      <span className="text-slate-900 font-medium">
                        {formatPrice(pricing.taxes_fees, pricing.currency)}
                      </span>
                    </div>
                  )}
                  {pricing.discount_amount !== undefined && pricing.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Discount</span>
                      <span className="text-emerald-600 font-medium">
                        -{formatPrice(pricing.discount_amount, pricing.currency)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-slate-200 pt-4 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-900 font-bold">Total</span>
                    <span className="text-2xl font-bold text-amber-500">
                      {formatPrice(pricing.total || itinerary.total_price, pricing.currency)}
                    </span>
                  </div>
                </div>

                {/* Discount Code */}
                <div>
                  <p className="text-sm text-slate-600 mb-2">Have a discount code?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {company_profile?.payment_qr_url && (
            <div className="mt-8 pt-8 border-t border-slate-700">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Ready to Confirm?</h4>
                  <p className="text-slate-300 text-sm max-w-md mb-3">
                    Scan the QR code to complete your payment securely. Your booking will be confirmed instantly.
                  </p>
                  {company_profile.payment_note && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs">
                      <Shield className="w-4 h-4" />
                      <span>{company_profile.payment_note}</span>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <img
                    src={`${baseUrl}${company_profile.payment_qr_url}`}
                    alt="Payment QR"
                    className="w-32 h-32 md:w-40 md:h-40"
                  />
                  <p className="text-sm font-medium text-amber-500 mt-2">
                    Scan to Pay {formatPrice(pricing?.total || itinerary.total_price, pricing?.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   DAY CARD COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
interface DayCardProps {
  day: PublicItineraryDay;
  isExpanded: boolean;
  onToggle: () => void;
  expandedActivities: Set<string>;
  toggleActivity: (id: string) => void;
  baseUrl: string;
  formatDuration: (value: number | null, unit: string | null) => string | null;
  formatDateFull: (dateStr: string) => string;
  // Personalization props
  showPersonalizationLink?: boolean;
  personalizationToken?: string;
}

const DayCard: React.FC<DayCardProps> = ({
  day,
  isExpanded,
  onToggle,
  expandedActivities,
  toggleActivity,
  baseUrl,
  formatDuration,
  formatDateFull,
  showPersonalizationLink = false,
  personalizationToken
}) => {
  const navigate = useNavigate();
  // Get preview images for avatar stack
  const previewImages = day.activities
    .flatMap(a => a.images || [])
    .filter(img => img.url)
    .slice(0, 3);

  const extraCount = Math.max(0, day.activities.flatMap(a => a.images || []).length - 3);

  return (
    <div>
      {/* Day Header - Dark */}
      <div
        onClick={onToggle}
        className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:from-slate-750 hover:to-slate-850 transition-colors"
      >
        {/* Day Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-400 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-800 uppercase">Day</span>
          <span className="text-2xl font-bold text-slate-800">{day.day_number}</span>
        </div>

        {/* Day Info */}
        <div className="flex-1 min-w-0">
          <p className="text-amber-400 text-sm font-medium">
            {formatDateFull(day.actual_date)}
          </p>
          <h3 className="text-white text-lg font-semibold truncate">
            {day.title || `Day ${day.day_number}`}
          </h3>
          <p className="text-slate-400 text-sm">
            {day.activities.length} activit{day.activities.length === 1 ? 'y' : 'ies'} planned
          </p>
        </div>

        {/* Avatar Stack */}
        {previewImages.length > 0 && (
          <div className="hidden md:flex items-center">
            {previewImages.map((img, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-full border-2 border-slate-800 overflow-hidden ${idx > 0 ? '-ml-3' : ''}`}
              >
                <img
                  src={`${baseUrl}${img.url}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center -ml-3">
                <span className="text-xs text-white font-medium">+{extraCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Chevron */}
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4">
          {/* Day Notes */}
          {day.notes && (
            <div className="bg-white rounded-xl p-4 mb-4 border-l-4 border-slate-300">
              <p className="text-slate-600 text-sm leading-relaxed">{day.notes}</p>
            </div>
          )}

          {/* Activities Timeline */}
          {day.activities.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-slate-400">No activities scheduled for this day</p>
            </div>
          ) : (
            <div className="relative">
              {day.activities.map((activity, idx) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isExpanded={expandedActivities.has(activity.id)}
                  onToggle={() => toggleActivity(activity.id)}
                  baseUrl={baseUrl}
                  formatDuration={formatDuration}
                  isLast={idx === day.activities.length - 1}
                />
              ))}
            </div>
          )}

          {/* Optional inline personalization entry - per spec */}
          {showPersonalizationLink && personalizationToken && (
            <button
              onClick={() => navigate(`/itinerary/${personalizationToken}/personalize`)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-colors group"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-emerald-700">
                Add experiences you'll love
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   ACTIVITY CARD COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

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
  isLast
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
    return (imgs || []).map((img) => {
      if (!img) return null;
      const url = img.url
        ? (String(img.url).startsWith('http') ? img.url : `${baseUrl}${img.url}`)
        : img.file_path
          ? `${baseUrl}/uploads/${img.file_path}`
          : '';
      return { ...img, url };
    }).filter(Boolean) as any[];
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
      <div className="flex gap-4 mb-4">
        {/* Timeline Column */}
        <div className="flex flex-col items-center w-16 flex-shrink-0">
          {/* Time Circle */}
          <div className="w-14 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-xs font-medium text-slate-600">
              {getTimeDisplay()}
            </span>
          </div>
          {/* Connector Line */}
          {!isLast && (
            <div className="flex-1 w-px bg-slate-200 mt-2" style={{ minHeight: '60px' }}></div>
          )}
        </div>

        {/* Logistics/Note/Custom Activity Content - Simpler Card */}
        <div className={`flex-1 rounded-xl border shadow-sm overflow-hidden ${
          itemType === 'LOGISTICS'
            ? 'bg-amber-50 border-amber-200'
            : itemType === 'NOTE'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="p-4 flex items-center gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              itemType === 'LOGISTICS'
                ? 'bg-amber-100 text-amber-600'
                : itemType === 'NOTE'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}>
              <IconComponent className="w-6 h-6" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Type Badge */}
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${
                itemType === 'LOGISTICS'
                  ? 'bg-amber-100 text-amber-700'
                  : itemType === 'NOTE'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {itemType === 'LOGISTICS' ? 'Logistics' : itemType === 'NOTE' ? 'Note' : 'Custom Activity'}
              </span>

              {/* Title */}
              <h4 className="text-slate-900 font-semibold">
                {activity.custom_title || activity.name}
              </h4>

              {/* Notes/Details */}
              {activity.custom_notes && (
                <p className="text-sm text-slate-600 mt-1">
                  {activity.custom_notes}
                </p>
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
    <div className="flex gap-4 mb-4">
      {/* Timeline Column */}
      <div className="flex flex-col items-center w-16 flex-shrink-0">
        {/* Time Circle */}
        <div className="w-14 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <span className="text-xs font-medium text-slate-600">
            {getTimeDisplay()}
          </span>
        </div>
        {/* Connector Line */}
        {!isLast && (
          <div className="flex-1 w-px bg-slate-200 mt-2" style={{ minHeight: '100px' }}></div>
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
              <img
                src={heroImage.url}
                alt={activity.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            {activity.category_label && (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${getCategoryStyle(activity.category_label)}`}>
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
          <div className="px-4 pb-4">
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

export default PublicItinerary;
