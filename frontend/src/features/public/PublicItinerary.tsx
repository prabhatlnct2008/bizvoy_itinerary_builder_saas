import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import shareApi from '../../api/share';
import { useWebSocket } from '../../hooks/useWebSocket';
import { PublicItineraryResponse } from '../../types';
import { PersonalizationEntry } from '../personalization/components/PersonalizationEntry';
import {
  ItineraryHero,
  TripOverviewSection,
  DayCard,
  ItineraryFooter,
} from '../../components/itinerary';
import { MapPin, Sparkles } from 'lucide-react';

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

  // Only use WebSocket in public mode with token
  const { isConnected, lastMessage } = useWebSocket(
    !isPreviewMode && token ? token : null,
    (!isPreviewMode && itinerary?.live_updates_enabled) || false
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
            This itinerary link may have expired or been removed. Please contact your travel agent
            for assistance.
          </p>
        </div>
      </div>
    );
  }

  const { trip_overview, company_profile, pricing } = itinerary;
  const totalDays = trip_overview?.total_days || itinerary.days.length;
  const totalNights = trip_overview?.total_nights || Math.max(0, itinerary.days.length - 1);

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
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-slate-500">
              {isConnected ? 'Live Updates Active' : 'Connecting...'}
            </span>
          </div>
        )}

        {/* Hero Section */}
        <ItineraryHero
          clientName={itinerary.client_name}
          destination={itinerary.destination}
          startDate={itinerary.start_date}
          endDate={itinerary.end_date}
          numAdults={itinerary.num_adults}
          numChildren={itinerary.num_children}
          totalDays={totalDays}
          totalNights={totalNights}
        />

        {/* Trip Overview Section */}
        {trip_overview && <TripOverviewSection overview={trip_overview} />}

        {/* Personalized Badge (shown when personalization was done) - Hidden in preview mode */}
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

        {/* Make This Trip Yours Section - Hidden in preview mode */}
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
                  : "Personalize your itinerary by swiping through curated experiences. It only takes 60 seconds to create your perfect trip."}
              </p>
            </div>

            {/* Personalization Entry CTA */}
            <PersonalizationEntry token={token} />
          </section>
        )}

        {/* Your Itinerary Section */}
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
          <div className="space-y-8">
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
                showPersonalizationLink={
                  !isPreviewMode &&
                  itinerary.personalization_enabled &&
                  !itinerary.personalization_completed
                }
                personalizationToken={token}
              />
            ))}
          </div>
        </section>

        {/* Footer / Booking Section */}
        <ItineraryFooter
          companyProfile={company_profile}
          pricing={pricing}
          totalPrice={itinerary.total_price}
          baseUrl={baseUrl}
        />
      </div>
    </div>
  );
};

export default PublicItinerary;
