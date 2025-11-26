import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  Mail,
  Phone,
  Globe,
  Building,
  Utensils,
  Car,
  Sparkles,
  DollarSign,
  Shield,
  Home,
  Plane,
  Sun,
  Moon,
  Camera,
  Heart,
  Compass,
  Mountain,
  Palmtree,
  Waves,
  Coffee,
  Wifi,
  Check,
  ArrowRight,
  Play,
  ExternalLink
} from 'lucide-react';

// Premium destination images for hero backgrounds
const destinationBackgrounds: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80',
  tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80',
  maldives: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1920&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80',
  santorini: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1920&q=80',
  switzerland: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80',
  thailand: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=80',
  italy: 'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?w=1920&q=80',
  greece: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1920&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
  mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
  city: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80',
};

const getBackgroundForDestination = (destination: string): string => {
  const lower = destination.toLowerCase();
  for (const [key, url] of Object.entries(destinationBackgrounds)) {
    if (lower.includes(key)) return url;
  }
  // Try to match generic terms
  if (lower.includes('beach') || lower.includes('island') || lower.includes('coast')) return destinationBackgrounds.beach;
  if (lower.includes('mountain') || lower.includes('alps') || lower.includes('hill')) return destinationBackgrounds.mountain;
  if (lower.includes('city') || lower.includes('town') || lower.includes('metro')) return destinationBackgrounds.city;
  return destinationBackgrounds.default;
};

const PublicItinerary: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [itinerary, setItinerary] = useState<PublicItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLastUpdated] = useState<Date | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [discountCode, setDiscountCode] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // WebSocket connection for live updates
  const { isConnected, lastMessage } = useWebSocket(
    token || null,
    itinerary?.live_updates_enabled || false
  );

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const expandAllDays = () => {
    const allDays = new Set(itinerary?.days.map(d => d.day_number) || []);
    setExpandedDays(allDays);
  };

  const collapseAllDays = () => {
    setExpandedDays(new Set());
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startFormatted = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endFormatted = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${startFormatted} — ${endFormatted}`;
  };

  const formatDuration = (value: number | null, unit: string | null) => {
    if (!value) return null;
    const unitLabel = unit === 'minutes' ? 'min' : unit === 'hours' ? 'hr' : unit || '';
    return `${value} ${unitLabel}${value > 1 && unit !== 'minutes' ? 's' : ''}`;
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  // Get hero background
  const heroBackground = itinerary ? getBackgroundForDestination(itinerary.destination) : destinationBackgrounds.default;

  // Get first activity image if available
  const getFirstActivityImage = () => {
    for (const day of itinerary?.days || []) {
      for (const activity of day.activities) {
        const heroImg = activity.images?.find(img => img.is_hero || img.is_primary);
        if (heroImg) return `${baseUrl}${heroImg.url}`;
        if (activity.images?.[0]) return `${baseUrl}${activity.images[0].url}`;
      }
    }
    return null;
  };

  const localHeroImage = getFirstActivityImage();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-950">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-amber-400/20"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-amber-400 animate-spin"></div>
            <Compass className="absolute inset-0 m-auto w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <p className="text-stone-400 text-sm tracking-widest uppercase">Preparing your journey</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-950">
        <div className="text-center max-w-md mx-auto p-10">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-amber-500/20 rounded-full blur-xl"></div>
            <div className="relative w-full h-full bg-stone-900 rounded-full flex items-center justify-center border border-stone-800">
              <MapPin className="w-10 h-10 text-rose-400" />
            </div>
          </div>
          <h1 className="text-2xl font-light text-white mb-3 tracking-wide">Journey Not Found</h1>
          <p className="text-stone-400 leading-relaxed">
            This itinerary may have expired or been removed. Please contact your travel curator for assistance.
          </p>
        </div>
      </div>
    );
  }

  const { trip_overview, company_profile, pricing } = itinerary;
  const nameParts = itinerary?.client_name?.split(' ') || [];
  const firstName = nameParts[0] || 'Traveler';

  return (
    <div className="min-h-screen bg-stone-950 text-white">

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: IMMERSIVE HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[100vh] flex flex-col justify-end overflow-hidden"
      >
        {/* Background Image with Parallax */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-100"
          style={{
            backgroundImage: `url(${localHeroImage || heroBackground})`,
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
          }}
        />

        {/* Sophisticated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/40 via-transparent to-stone-950/40" />

        {/* Subtle Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Live Updates Badge */}
        {itinerary.live_updates_enabled && (
          <div className="absolute top-6 right-6 z-20">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md ${
              isConnected ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-stone-800/50 border border-stone-700/50'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
              <span className="text-xs font-medium tracking-wide">
                {isConnected ? 'LIVE' : 'CONNECTING'}
              </span>
            </div>
          </div>
        )}

        {/* Company Branding (Top Left) */}
        {company_profile && (
          <div className="absolute top-6 left-6 z-20">
            <div className="flex items-center gap-3">
              {company_profile.logo_url ? (
                <img
                  src={`${baseUrl}${company_profile.logo_url}`}
                  alt={company_profile.company_name || ''}
                  className="w-10 h-10 rounded-xl object-cover bg-white/10 backdrop-blur-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Building className="w-5 h-5 text-white/70" />
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white/90">{company_profile.company_name}</p>
                {company_profile.tagline && (
                  <p className="text-xs text-white/50">{company_profile.tagline}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 px-6 md:px-12 lg:px-20 pb-16 md:pb-24 max-w-6xl">
          {/* Destination Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium tracking-wide">{itinerary.destination}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight mb-4">
            <span className="text-white/60">Hello, </span>
            <span className="text-white font-normal">{firstName}</span>
          </h1>

          {/* Trip Name as Subtitle */}
          {itinerary.trip_name && (
            <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-amber-400/90 mb-6 max-w-2xl">
              {itinerary.trip_name}
            </h2>
          )}

          {/* Tagline */}
          <p className="text-lg md:text-xl text-white/60 font-light max-w-xl mb-10 leading-relaxed">
            Your curated journey awaits. Every moment has been thoughtfully crafted for an extraordinary experience.
          </p>

          {/* Hero Stats */}
          <div className="flex flex-wrap gap-6 md:gap-10">
            <div className="group">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-amber-400/10 group-hover:border-amber-400/30 transition-all duration-300">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-light text-white">
                    {trip_overview?.total_days || itinerary.days.length}
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Days</p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-amber-400/10 group-hover:border-amber-400/30 transition-all duration-300">
                  <Moon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-light text-white">
                    {trip_overview?.total_nights || Math.max(0, itinerary.days.length - 1)}
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Nights</p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-amber-400/10 group-hover:border-amber-400/30 transition-all duration-300">
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-light text-white">
                    {itinerary.num_adults + itinerary.num_children}
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Travelers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Dates */}
          <div className="mt-8 inline-flex items-center gap-2 text-white/50">
            <Plane className="w-4 h-4" />
            <span className="text-sm tracking-wide">{formatDateRange(itinerary.start_date, itinerary.end_date)}</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: TRIP HIGHLIGHTS OVERVIEW
          ═══════════════════════════════════════════════════════════════ */}
      {trip_overview && (
        <section className="relative py-20 md:py-28 px-6 md:px-12 lg:px-20 bg-stone-950">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <p className="text-xs font-medium tracking-[0.3em] text-amber-400/70 uppercase mb-4">
                Your Journey Includes
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-white">
                Trip Highlights
              </h2>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {trip_overview.accommodation_count > 0 && (
                <HighlightCard
                  icon={<Home className="w-6 h-6" />}
                  count={trip_overview.accommodation_count}
                  label="Accommodations"
                  sublabel="Handpicked stays"
                  gradient="from-violet-500/20 to-indigo-500/20"
                  iconColor="text-violet-400"
                />
              )}

              {trip_overview.activity_count > 0 && (
                <HighlightCard
                  icon={<Sparkles className="w-6 h-6" />}
                  count={trip_overview.activity_count}
                  label="Experiences"
                  sublabel="Curated activities"
                  gradient="from-amber-500/20 to-orange-500/20"
                  iconColor="text-amber-400"
                />
              )}

              {trip_overview.meal_count > 0 && (
                <HighlightCard
                  icon={<Utensils className="w-6 h-6" />}
                  count={trip_overview.meal_count}
                  label="Culinary"
                  sublabel="Dining experiences"
                  gradient="from-emerald-500/20 to-teal-500/20"
                  iconColor="text-emerald-400"
                />
              )}

              {trip_overview.transfer_count > 0 && (
                <HighlightCard
                  icon={<Car className="w-6 h-6" />}
                  count={trip_overview.transfer_count}
                  label="Transfers"
                  sublabel="Seamless journeys"
                  gradient="from-sky-500/20 to-blue-500/20"
                  iconColor="text-sky-400"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: DAY-BY-DAY ITINERARY
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 px-6 md:px-12 lg:px-20">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-medium tracking-[0.3em] text-amber-400/70 uppercase mb-4">
                Day by Day
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-white">
                Your Itinerary
              </h2>
            </div>

            {/* Expand/Collapse Controls */}
            <div className="flex gap-3">
              <button
                onClick={expandAllDays}
                className="px-4 py-2 text-xs font-medium tracking-wide text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-full transition-all duration-300"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllDays}
                className="px-4 py-2 text-xs font-medium tracking-wide text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-full transition-all duration-300"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Days Timeline */}
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-[23px] md:left-[31px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/50 via-white/10 to-transparent" />

            {/* Day Cards */}
            <div className="space-y-6">
              {itinerary.days.map((day, index) => (
                <DaySection
                  key={day.id}
                  day={day}
                  isExpanded={expandedDays.has(day.day_number)}
                  onToggle={() => toggleDay(day.day_number)}
                  baseUrl={baseUrl}
                  formatDuration={formatDuration}
                  isFirst={index === 0}
                  isLast={index === itinerary.days.length - 1}
                  activeImageIndex={activeImageIndex}
                  setActiveImageIndex={setActiveImageIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: PRICING & BOOKING
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 px-6 md:px-12 lg:px-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">

            {/* Left: Company & Contact */}
            <div>
              <p className="text-xs font-medium tracking-[0.3em] text-amber-400/70 uppercase mb-6">
                Your Travel Curator
              </p>

              {/* Company Card */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex items-start gap-5 mb-6">
                  {company_profile?.logo_url ? (
                    <img
                      src={`${baseUrl}${company_profile.logo_url}`}
                      alt={company_profile.company_name || 'Company'}
                      className="w-16 h-16 rounded-2xl object-cover bg-white/5"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Building className="w-8 h-8 text-white/30" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-medium text-white">
                      {company_profile?.company_name || 'Travel Agency'}
                    </h3>
                    {company_profile?.tagline && (
                      <p className="text-sm text-white/50 mt-1">{company_profile.tagline}</p>
                    )}
                  </div>
                </div>

                {company_profile?.description && (
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    {company_profile.description}
                  </p>
                )}

                {/* Contact Links */}
                <div className="space-y-3">
                  {company_profile?.email && (
                    <a
                      href={`mailto:${company_profile.email}`}
                      className="flex items-center gap-4 text-white/70 hover:text-amber-400 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-400/10 transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{company_profile.email}</span>
                    </a>
                  )}

                  {company_profile?.phone && (
                    <a
                      href={`tel:${company_profile.phone}`}
                      className="flex items-center gap-4 text-white/70 hover:text-amber-400 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-400/10 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{company_profile.phone}</span>
                    </a>
                  )}

                  {company_profile?.website_url && (
                    <a
                      href={company_profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 text-white/70 hover:text-amber-400 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-400/10 transition-colors">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{company_profile.website_url}</span>
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Pricing & Payment */}
            <div>
              <p className="text-xs font-medium tracking-[0.3em] text-amber-400/70 uppercase mb-6">
                Investment
              </p>

              {/* Pricing Card */}
              {pricing && (
                <div className="bg-gradient-to-br from-amber-400/10 via-white/[0.02] to-white/[0.02] border border-amber-400/20 rounded-3xl p-8 backdrop-blur-sm">
                  <h3 className="text-lg font-medium text-white mb-6">Price Summary</h3>

                  <div className="space-y-4 mb-6">
                    {pricing.base_package && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">Base Package</span>
                        <span className="text-white font-medium">
                          {pricing.currency === 'USD' ? '$' : pricing.currency}
                          {pricing.base_package.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {pricing.taxes_fees !== undefined && pricing.taxes_fees > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">Taxes & Fees</span>
                        <span className="text-white font-medium">
                          {pricing.currency === 'USD' ? '$' : pricing.currency}
                          {pricing.taxes_fees.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {pricing.discount_amount !== undefined && pricing.discount_amount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400">
                          Discount {pricing.discount_code && `(${pricing.discount_code})`}
                        </span>
                        <span className="text-emerald-400 font-medium">
                          -{pricing.currency === 'USD' ? '$' : pricing.currency}
                          {pricing.discount_amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t border-white/10 pt-6 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="text-white/60 text-sm">Total Investment</span>
                      <div className="text-right">
                        <span className="text-4xl font-light text-amber-400">
                          {pricing.currency === 'USD' ? '$' : pricing.currency}
                          {(pricing.total || itinerary.total_price || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Discount Code */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Have a promo code?"
                      className="flex-1 bg-stone-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-colors"
                    />
                    <button className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-medium px-6 py-3 rounded-xl transition-colors">
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Payment QR */}
              {company_profile?.payment_qr_url && (
                <div className="mt-6 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-white rounded-2xl p-4">
                      <img
                        src={`${baseUrl}${company_profile.payment_qr_url}`}
                        alt="Payment QR"
                        className="w-28 h-28 md:w-32 md:h-32"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-white mb-2">Ready to Book?</h4>
                      <p className="text-sm text-white/60 leading-relaxed mb-4">
                        Scan the QR code to complete your secure payment. Your journey will be confirmed instantly.
                      </p>
                      {company_profile.payment_note && (
                        <div className="flex items-center gap-2 text-emerald-400 text-xs">
                          <Shield className="w-4 h-4" />
                          <span>{company_profile.payment_note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-white/30 tracking-wide">
            Crafted with care • Powered by BizVoy
          </p>
        </div>
      </footer>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HIGHLIGHT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════
interface HighlightCardProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  sublabel: string;
  gradient: string;
  iconColor: string;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ icon, count, label, sublabel, gradient, iconColor }) => (
  <div className={`relative group bg-gradient-to-br ${gradient} rounded-3xl p-6 md:p-8 border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/10 hover:scale-[1.02]`}>
    {/* Glow Effect */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} blur-xl`} />
    </div>

    <div className="relative">
      <div className={`${iconColor} mb-4`}>{icon}</div>
      <p className="text-4xl md:text-5xl font-extralight text-white mb-2">{count}</p>
      <p className="text-sm font-medium text-white/90">{label}</p>
      <p className="text-xs text-white/50 mt-1">{sublabel}</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// DAY SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════
interface DaySectionProps {
  day: PublicItineraryDay;
  isExpanded: boolean;
  onToggle: () => void;
  baseUrl: string;
  formatDuration: (value: number | null, unit: string | null) => string | null;
  isFirst: boolean;
  isLast: boolean;
  activeImageIndex: Record<string, number>;
  setActiveImageIndex: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const DaySection: React.FC<DaySectionProps> = ({
  day,
  isExpanded,
  onToggle,
  baseUrl,
  formatDuration,
  isFirst,
  isLast,
  activeImageIndex,
  setActiveImageIndex
}) => {
  const dayDate = new Date(day.actual_date);
  const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Get preview images
  const previewImages = day.activities
    .flatMap(a => a.images || [])
    .filter(img => img.url)
    .slice(0, 4);

  return (
    <div className="relative pl-12 md:pl-16">
      {/* Timeline Node */}
      <div className="absolute left-0 top-0 flex flex-col items-center">
        <div
          className={`relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
            isExpanded
              ? 'bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/25'
              : 'bg-stone-900 text-white border border-white/10 hover:border-amber-400/50'
          }`}
          onClick={onToggle}
        >
          <span className="text-xl md:text-2xl font-light">{day.day_number}</span>
        </div>
      </div>

      {/* Day Card */}
      <div
        className={`bg-white/[0.02] rounded-3xl border transition-all duration-300 overflow-hidden ${
          isExpanded ? 'border-white/10' : 'border-white/5 hover:border-white/10'
        }`}
      >
        {/* Header */}
        <div
          onClick={onToggle}
          className="flex items-center justify-between gap-4 p-6 cursor-pointer group"
        >
          <div className="flex-1 min-w-0">
            {/* Date Badge */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">{dayOfWeek}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-xs text-white/50">{monthDay}</span>
            </div>

            {/* Title */}
            <h3 className="text-lg md:text-xl font-light text-white truncate">
              {day.title || `Day ${day.day_number}`}
            </h3>

            {/* Activity Count */}
            <p className="text-sm text-white/40 mt-1">
              {day.activities.length} experience{day.activities.length !== 1 ? 's' : ''} planned
            </p>
          </div>

          {/* Preview Images */}
          {previewImages.length > 0 && !isExpanded && (
            <div className="hidden md:flex items-center -space-x-3">
              {previewImages.map((img, idx) => (
                <div
                  key={idx}
                  className="w-12 h-12 rounded-xl overflow-hidden border-2 border-stone-950 transition-transform hover:scale-110 hover:z-10"
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
          <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-all duration-300 group-hover:bg-white/10 ${
            isExpanded ? 'rotate-180' : ''
          }`}>
            <ChevronDown className="w-5 h-5 text-white/50" />
          </div>
        </div>

        {/* Expandable Content */}
        <div className={`transition-all duration-500 ease-out ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-6 pb-6 space-y-6">
            {/* Day Notes */}
            {day.notes && (
              <div className="bg-amber-400/5 border border-amber-400/10 rounded-2xl p-5">
                <p className="text-sm text-white/70 leading-relaxed">{day.notes}</p>
              </div>
            )}

            {/* Activities */}
            {day.activities.length === 0 ? (
              <div className="text-center py-12">
                <Sun className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40">Free day to explore at your leisure</p>
              </div>
            ) : (
              <div className="space-y-6">
                {day.activities.map((activity, idx) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    baseUrl={baseUrl}
                    formatDuration={formatDuration}
                    showTimeline={idx < day.activities.length - 1}
                    activeImageIndex={activeImageIndex}
                    setActiveImageIndex={setActiveImageIndex}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACTIVITY CARD COMPONENT
// ═══════════════════════════════════════════════════════════════
interface ActivityCardProps {
  activity: PublicActivity;
  baseUrl: string;
  formatDuration: (value: number | null, unit: string | null) => string | null;
  showTimeline: boolean;
  activeImageIndex: Record<string, number>;
  setActiveImageIndex: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  baseUrl,
  formatDuration,
  showTimeline,
  activeImageIndex,
  setActiveImageIndex
}) => {
  const duration = formatDuration(activity.default_duration_value, activity.default_duration_unit);
  const images = activity.images || [];
  const currentImageIdx = activeImageIndex[activity.id] || 0;

  const getCategoryConfig = (category: string | null) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('sightseeing') || cat.includes('tour') || cat.includes('excursion')) {
      return { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', icon: <Compass className="w-3.5 h-3.5" /> };
    }
    if (cat.includes('dining') || cat.includes('meal') || cat.includes('food') || cat.includes('restaurant')) {
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: <Utensils className="w-3.5 h-3.5" /> };
    }
    if (cat.includes('stay') || cat.includes('hotel') || cat.includes('accommodation') || cat.includes('resort')) {
      return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: <Home className="w-3.5 h-3.5" /> };
    }
    if (cat.includes('transfer') || cat.includes('transport')) {
      return { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400', icon: <Car className="w-3.5 h-3.5" /> };
    }
    if (cat.includes('adventure') || cat.includes('sport')) {
      return { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', icon: <Mountain className="w-3.5 h-3.5" /> };
    }
    if (cat.includes('relax') || cat.includes('spa') || cat.includes('wellness')) {
      return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', icon: <Waves className="w-3.5 h-3.5" /> };
    }
    return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/70', icon: <Sparkles className="w-3.5 h-3.5" /> };
  };

  const catConfig = getCategoryConfig(activity.category_label);

  const nextImage = () => {
    if (images.length > 1) {
      setActiveImageIndex(prev => ({
        ...prev,
        [activity.id]: (currentImageIdx + 1) % images.length
      }));
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setActiveImageIndex(prev => ({
        ...prev,
        [activity.id]: currentImageIdx === 0 ? images.length - 1 : currentImageIdx - 1
      }));
    }
  };

  return (
    <div className="group">
      <div className="flex gap-4 md:gap-6">
        {/* Time Badge */}
        {activity.time_slot && (
          <div className="flex-shrink-0 w-16 md:w-20 text-right">
            <span className="inline-block px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70">
              {activity.time_slot}
            </span>
          </div>
        )}

        {/* Activity Content */}
        <div className="flex-1 bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300">

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="relative aspect-[21/9] overflow-hidden">
              <img
                src={`${baseUrl}${images[currentImageIdx]?.url}`}
                alt={activity.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Image Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />

              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Image Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex(prev => ({ ...prev, [activity.id]: idx }));
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIdx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Category Badge on Image */}
              {activity.category_label && (
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${catConfig.bg} ${catConfig.border} border backdrop-blur-sm`}>
                    <span className={catConfig.text}>{catConfig.icon}</span>
                    <span className={`text-xs font-medium ${catConfig.text}`}>{activity.category_label}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Category Badge (if no image) */}
            {!images.length && activity.category_label && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${catConfig.bg} ${catConfig.border} border mb-4`}>
                <span className={catConfig.text}>{catConfig.icon}</span>
                <span className={`text-xs font-medium ${catConfig.text}`}>{activity.category_label}</span>
              </span>
            )}

            {/* Title */}
            <h4 className="text-xl font-medium text-white mb-3">
              {activity.name}
            </h4>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 mb-4">
              {duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {duration}
                </span>
              )}
              {activity.location_display && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {activity.location_display}
                </span>
              )}
            </div>

            {/* Description */}
            {(activity.client_description || activity.short_description) && (
              <p className="text-sm text-white/60 leading-relaxed mb-5">
                {activity.client_description || activity.short_description}
              </p>
            )}

            {/* Custom Notes */}
            {activity.custom_notes && (
              <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-4 mb-5">
                <p className="text-sm text-sky-300/90">{activity.custom_notes}</p>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-white/[0.02] rounded-xl mb-5">
              {/* Rating */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Star className={`w-4 h-4 ${activity.rating ? 'text-amber-400 fill-current' : 'text-white/20'}`} />
                  <span className={`font-medium ${activity.rating ? 'text-white' : 'text-white/30'}`}>
                    {activity.rating || '—'}
                  </span>
                </div>
                <p className="text-xs text-white/40">Rating</p>
              </div>

              {/* Group Size */}
              <div className="text-center border-x border-white/5">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-white/50" />
                  <span className={`font-medium ${activity.group_size_label ? 'text-white' : 'text-white/30'}`}>
                    {activity.group_size_label || '—'}
                  </span>
                </div>
                <p className="text-xs text-white/40">Group Size</p>
              </div>

              {/* Cost */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <DollarSign className={`w-4 h-4 ${activity.cost_type === 'included' ? 'text-emerald-400' : 'text-white/50'}`} />
                  <span className={`font-medium ${activity.cost_type === 'included' ? 'text-emerald-400' : 'text-white'}`}>
                    {activity.cost_type === 'included' ? 'Included' : activity.cost_display || 'Extra'}
                  </span>
                </div>
                <p className="text-xs text-white/40">Cost</p>
              </div>
            </div>

            {/* Highlights */}
            {activity.highlights && activity.highlights.length > 0 && (
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {activity.highlights.map((highlight, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/5 border border-amber-400/10 text-xs text-amber-300/90 hover:bg-amber-400/10 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Connector */}
      {showTimeline && (
        <div className="ml-8 md:ml-10 pl-12 md:pl-16 py-4">
          <div className="w-px h-8 bg-gradient-to-b from-white/10 to-transparent" />
        </div>
      )}
    </div>
  );
};

export default PublicItinerary;
