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
  const [, setLastUpdated] = useState<Date | null>(null);
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

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  };

  const formatDuration = (value: number | null, unit: string | null) => {
    if (!value) return null;
    const unitLabel = unit === 'minutes' ? 'mins' : unit === 'hours' ? 'hrs' : unit || '';
    return `${value} ${unitLabel}`;
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  // Split client name into first and last name
  const nameParts = itinerary?.client_name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8 md:space-y-10">

        {/* Live Updates Indicator */}
        {itinerary.live_updates_enabled && (
          <div className="flex items-center justify-end gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-slate-500">
              {isConnected ? 'Live Updates Active' : 'Connecting...'}
            </span>
          </div>
        )}

        {/* ============================================
            SECTION 1: HERO - "Welcome Aboard" Panel
            ============================================ */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-3xl px-6 md:px-10 py-8 md:py-10 shadow-xl">
          <div className="flex flex-col gap-6 md:gap-8">
            {/* Top Label */}
            <p className="text-xs font-medium tracking-[0.25em] text-amber-300 uppercase">
              Welcome Aboard
            </p>

            {/* Main Heading */}
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                <span className="text-slate-100">Hello, </span>
                <span className="text-white">{firstName}</span>
                {lastName && <span className="text-white font-bold"> {lastName}</span>}
              </h1>
              {/* Subtitle */}
              <p className="mt-2 text-sm md:text-base text-slate-200 max-w-xl">
                Your journey to {itinerary.destination} awaits. Here's everything you need for an unforgettable adventure.
              </p>
            </div>

            {/* Hero Metrics Row */}
            <div className="mt-6 grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
              {/* Duration */}
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="bg-white/10 rounded-full p-2 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-200 uppercase tracking-[0.16em]">Duration</p>
                  <p className="text-sm md:text-base font-medium text-white">
                    {trip_overview?.total_days || itinerary.days.length}D / {trip_overview?.total_nights || Math.max(0, itinerary.days.length - 1)}N
                  </p>
                </div>
              </div>

              {/* Destination */}
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="bg-white/10 rounded-full p-2 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-200 uppercase tracking-[0.16em]">Destination</p>
                  <p className="text-sm md:text-base font-medium text-white truncate">{itinerary.destination}</p>
                </div>
              </div>

              {/* Travellers */}
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="bg-white/10 rounded-full p-2 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-200 uppercase tracking-[0.16em]">Travellers</p>
                  <p className="text-sm md:text-base font-medium text-white">
                    {itinerary.num_adults + itinerary.num_children} Guest{itinerary.num_adults + itinerary.num_children !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Travel Dates */}
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 col-span-2 md:col-span-1">
                <div className="bg-white/10 rounded-full p-2 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-200 uppercase tracking-[0.16em]">Travel Dates</p>
                  <p className="text-sm md:text-base font-medium text-white">
                    {formatDateRange(itinerary.start_date, itinerary.end_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            SECTION 2: TRIP OVERVIEW STATS ROW
            ============================================ */}
        {trip_overview && (
          <section className="mt-6 md:mt-8">
            <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase mb-3 text-center">
              Trip Overview
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* Accommodations */}
              {trip_overview.accommodation_count > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-4 flex flex-col items-start">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-indigo-100 text-indigo-600">
                    <Home className="w-5 h-5" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{trip_overview.accommodation_count}</p>
                  <p className="text-xs text-slate-500 mt-1">Accommodations</p>
                </div>
              )}

              {/* Activities */}
              {trip_overview.activity_count > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-4 flex flex-col items-start">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-amber-100 text-amber-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{trip_overview.activity_count}</p>
                  <p className="text-xs text-slate-500 mt-1">Activities</p>
                </div>
              )}

              {/* Meals */}
              {trip_overview.meal_count > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-4 flex flex-col items-start">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-emerald-100 text-emerald-600">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{trip_overview.meal_count}</p>
                  <p className="text-xs text-slate-500 mt-1">Meals</p>
                </div>
              )}

              {/* Transfers */}
              {trip_overview.transfer_count > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-4 flex flex-col items-start">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-purple-100 text-purple-600">
                    <Car className="w-5 h-5" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{trip_overview.transfer_count}</p>
                  <p className="text-xs text-slate-500 mt-1">Transfers</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================
            SECTION 3: ITINERARY DAYS LIST (Accordion)
            ============================================ */}
        <section className="mt-10">
          <p className="mb-4 text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
            Your Itinerary
          </p>
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
        </section>

        {/* ============================================
            SECTION 4: FINAL BOOKING SECTION
            ============================================ */}
        <section className="mt-10 md:mt-12 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl px-6 md:px-10 py-8 md:py-10 text-slate-50">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">

            {/* Left Column - Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                {company_profile?.logo_url ? (
                  <img
                    src={`${baseUrl}${company_profile.logo_url}`}
                    alt={company_profile.company_name || 'Company Logo'}
                    className="w-14 h-14 rounded-xl object-cover bg-white"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                    <Building className="w-7 h-7 text-slate-300" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">
                    {company_profile?.company_name || 'Travel Agency'}
                  </h3>
                  {company_profile?.tagline && (
                    <p className="mt-1 text-sm text-slate-300">{company_profile.tagline}</p>
                  )}
                </div>
              </div>

              {company_profile?.description && (
                <p className="mt-3 text-sm text-slate-300 max-w-md">
                  {company_profile.description}
                </p>
              )}

              {/* Contact List */}
              <div className="mt-4 space-y-2 text-sm">
                {company_profile?.email && (
                  <a
                    href={`mailto:${company_profile.email}`}
                    className="flex items-center gap-3 text-slate-100 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-200 text-sm">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span>{company_profile.email}</span>
                  </a>
                )}
                {company_profile?.phone && (
                  <a
                    href={`tel:${company_profile.phone}`}
                    className="flex items-center gap-3 text-slate-100 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-200 text-sm">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span>{company_profile.phone}</span>
                  </a>
                )}
                {company_profile?.website_url && (
                  <a
                    href={company_profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-100 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-200 text-sm">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span>{company_profile.website_url}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column - Price Summary Card */}
            {pricing && (
              <div className="w-full md:w-80 bg-white/5 rounded-2xl border border-white/10 px-5 py-4 md:px-6 md:py-5">
                <h4 className="text-sm font-semibold text-slate-100">Price Summary</h4>

                <div className="mt-3 space-y-2">
                  {pricing.base_package && (
                    <div className="flex items-center justify-between text-sm text-slate-200">
                      <span>Base Package</span>
                      <span>
                        {pricing.currency === 'USD' ? '$' : pricing.currency}
                        {pricing.base_package.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {pricing.taxes_fees && pricing.taxes_fees > 0 && (
                    <div className="flex items-center justify-between text-sm text-slate-200">
                      <span>Taxes & Fees</span>
                      <span>
                        {pricing.currency === 'USD' ? '$' : pricing.currency}
                        {pricing.taxes_fees.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {pricing.discount_amount && pricing.discount_amount > 0 && (
                    <div className="flex items-center justify-between text-sm text-emerald-400">
                      <span>Discount {pricing.discount_code && `(${pricing.discount_code})`}</span>
                      <span>-{pricing.currency === 'USD' ? '$' : pricing.currency}{pricing.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Total Row */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total</span>
                  <span className="text-2xl font-semibold text-amber-300">
                    {pricing.currency === 'USD' ? '$' : pricing.currency}
                    {(pricing.total || itinerary.total_price || 0).toLocaleString()}
                  </span>
                </div>

                {/* Discount Code Input */}
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Discount code"
                    className="flex-1 rounded-lg bg-slate-900/40 border border-slate-500/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button className="bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom - Ready to Confirm + QR */}
          {company_profile?.payment_qr_url && (
            <div className="mt-8 border-t border-white/10 pt-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                {/* Left side */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">Ready to Confirm?</h4>
                  <p className="mt-1 text-xs md:text-sm text-slate-300 max-w-sm">
                    Scan the QR code to complete your payment securely. Your booking will be confirmed instantly.
                  </p>
                  {company_profile.payment_note && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-300">
                      <Shield className="w-3 h-3" />
                      <span>{company_profile.payment_note}</span>
                    </div>
                  )}
                </div>

                {/* Right side - QR */}
                <div className="bg-white rounded-2xl p-3 shadow-lg">
                  <img
                    src={`${baseUrl}${company_profile.payment_qr_url}`}
                    alt="Payment QR Code"
                    className="w-28 h-28 md:w-32 md:h-32"
                  />
                  <p className="mt-2 text-[11px] font-medium text-slate-800 text-center">
                    Scan to Pay {pricing?.currency === 'USD' ? '$' : pricing?.currency}
                    {(pricing?.total || itinerary.total_price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Powered By */}
        <div className="text-center text-slate-400 text-xs py-4">
          <p>Powered by Travel SaaS Itinerary Builder</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DAY SECTION COMPONENT
// ============================================
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

  // Get activity images for avatar stack
  const activityImages = day.activities
    .flatMap(a => a.images || [])
    .filter(img => img.url)
    .slice(0, 3);

  return (
    <div>
      {/* Day Card - Clickable Header */}
      <div
        onClick={onToggle}
        className={`bg-white rounded-2xl shadow-sm border border-slate-100 px-5 md:px-6 py-4 md:py-5 flex items-center justify-between gap-4 cursor-pointer transition hover:shadow-md hover:translate-y-[1px] ${
          isExpanded ? 'rounded-b-none border-b-0' : ''
        }`}
      >
        {/* Left cluster */}
        <div className="flex items-center gap-4">
          {/* Day badge + date */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                isExpanded
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {day.day_number}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* Day text block */}
          <div>
            <h3 className="text-sm md:text-base font-semibold text-slate-900">
              {day.title || `Day ${day.day_number}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {day.activities.length} activit{day.activities.length === 1 ? 'y' : 'ies'} planned
            </p>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center">
          {/* Avatar stack */}
          {activityImages.length > 0 && (
            <div className="flex items-center">
              {activityImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-full border-2 border-white overflow-hidden ${
                    idx > 0 ? '-ml-2' : ''
                  }`}
                >
                  <img
                    src={`${baseUrl}${img.url}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Chevron */}
          <ChevronDown
            className={`ml-3 w-5 h-5 text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Day Details - Expandable with smooth transition */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-slate-50 rounded-b-2xl border border-t-0 border-slate-100 px-5 md:px-6 py-5 md:py-6 space-y-5 md:space-y-6">
          {/* Optional Day Intro Text */}
          {day.notes && (
            <p className="text-sm text-slate-700">{day.notes}</p>
          )}

          {/* Timeline Layout */}
          {day.activities.length === 0 ? (
            <p className="text-center text-slate-400 py-8">
              No activities scheduled for this day
            </p>
          ) : (
            day.activities.map((activity, idx) => (
              <div key={activity.id} className="flex items-stretch gap-4 md:gap-5">
                {/* Left column (timeline) */}
                <div className="w-14 flex flex-col items-center">
                  {/* Time pill */}
                  {activity.time_slot && (
                    <span className="text-xs font-medium text-slate-700 border border-slate-200 rounded-full px-3 py-1 bg-white whitespace-nowrap">
                      {activity.time_slot}
                    </span>
                  )}
                  {/* Vertical line (connector) */}
                  {idx < day.activities.length - 1 && (
                    <div className="flex-1 w-px bg-slate-200 mt-2"></div>
                  )}
                </div>

                {/* Right column (activity card) */}
                <div className="flex-1">
                  <ActivityCard
                    activity={activity}
                    baseUrl={baseUrl}
                    formatDuration={formatDuration}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// ACTIVITY CARD COMPONENT
// ============================================
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

  // Get category color classes
  const getCategoryStyles = (category: string | null) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('sightseeing') || cat.includes('tour') || cat.includes('excursion')) {
      return 'bg-indigo-50 text-indigo-700';
    }
    if (cat.includes('dining') || cat.includes('meal') || cat.includes('food') || cat.includes('restaurant')) {
      return 'bg-amber-50 text-amber-700';
    }
    if (cat.includes('stay') || cat.includes('hotel') || cat.includes('accommodation') || cat.includes('resort')) {
      return 'bg-emerald-50 text-emerald-700';
    }
    if (cat.includes('transfer') || cat.includes('transport')) {
      return 'bg-purple-50 text-purple-700';
    }
    if (cat.includes('adventure') || cat.includes('sport')) {
      return 'bg-rose-50 text-rose-700';
    }
    if (cat.includes('relax') || cat.includes('spa') || cat.includes('wellness')) {
      return 'bg-cyan-50 text-cyan-700';
    }
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition transform hover:shadow-md hover:-translate-y-[1px]">
      {/* Header Bar */}
      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3">
        {/* Category pill */}
        {activity.category_label && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getCategoryStyles(activity.category_label)}`}>
            {activity.category_label}
          </span>
        )}

        {/* Title */}
        <h4 className="mt-2 text-sm md:text-base font-semibold text-slate-900">
          {activity.name}
        </h4>

        {/* Meta row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
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

      {/* Image Collage with Hover Zoom */}
      {activity.images && activity.images.length > 0 && (
        <div className="mt-3 md:mt-4 grid grid-cols-3 gap-2 md:gap-3 px-4 md:px-5">
          {/* Large image (left) */}
          {heroImage && (
            <div className={`${otherImages.length > 0 ? 'col-span-2' : 'col-span-3'} aspect-[16/9] rounded-xl overflow-hidden`}>
              <img
                src={`${baseUrl}${heroImage.url}`}
                alt={activity.name}
                className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              />
            </div>
          )}

          {/* Small images (right) */}
          {otherImages.length > 0 && (
            <div className="flex flex-col gap-2 md:gap-3">
              {otherImages.map((img, idx) => (
                <div key={idx} className="aspect-[16/9] rounded-xl overflow-hidden">
                  <img
                    src={`${baseUrl}${img.url}`}
                    alt={`${activity.name} ${idx + 2}`}
                    className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {(activity.client_description || activity.short_description) && (
        <p className="px-4 md:px-5 mt-4 text-sm text-slate-700 leading-relaxed">
          {activity.client_description || activity.short_description}
        </p>
      )}

      {/* Custom Notes */}
      {activity.custom_notes && (
        <div className="mx-4 md:mx-5 mt-3 bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r-lg">
          <p className="text-sm text-blue-800">{activity.custom_notes}</p>
        </div>
      )}

      {/* Stats Row (Rating / Group Size / Cost) */}
      <div className="mt-4 bg-slate-50 rounded-2xl mx-4 md:mx-5 px-4 py-3 grid grid-cols-3 gap-3 text-xs md:text-sm text-slate-700">
        {/* Rating */}
        <div className="text-center">
          {activity.rating ? (
            <>
              <div className="flex items-center justify-center gap-1 font-semibold text-slate-900">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span>{activity.rating}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Rating</p>
            </>
          ) : (
            <>
              <div className="font-semibold text-slate-400">-</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Rating</p>
            </>
          )}
        </div>

        {/* Group Size */}
        <div className="text-center">
          {activity.group_size_label ? (
            <>
              <div className="flex items-center justify-center gap-1 font-semibold text-slate-900">
                <Users className="w-4 h-4 text-slate-500" />
                <span>{activity.group_size_label}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Group Size</p>
            </>
          ) : (
            <>
              <div className="font-semibold text-slate-400">-</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Group Size</p>
            </>
          )}
        </div>

        {/* Cost */}
        <div className="text-center">
          <div className={`flex items-center justify-center gap-1 font-semibold ${
            activity.cost_type === 'included' ? 'text-emerald-600' : 'text-slate-900'
          }`}>
            <DollarSign className="w-4 h-4" />
            <span>
              {activity.cost_type === 'included' ? 'Included' : activity.cost_display || 'Extra'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Cost</p>
        </div>
      </div>

      {/* Highlights Tags */}
      {activity.highlights && activity.highlights.length > 0 && (
        <div className="px-4 md:px-5 mt-4 mb-4">
          <p className="text-xs font-semibold text-slate-900">Highlights:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {activity.highlights.map((highlight, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 shadow-[0_1px_0_rgba(0,0,0,0.02)] hover:bg-amber-100 hover:border-amber-200 hover:text-amber-900 hover:-translate-y-[1px] transition cursor-default"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom padding if no highlights */}
      {(!activity.highlights || activity.highlights.length === 0) && (
        <div className="pb-4"></div>
      )}
    </div>
  );
};

export default PublicItinerary;
