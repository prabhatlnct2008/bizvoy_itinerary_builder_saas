import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import shareApi from '../../api/share';
import { useWebSocket } from '../../hooks/useWebSocket';
import { PublicItineraryResponse } from '../../types';

const PublicItinerary: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [itinerary, setItinerary] = useState<PublicItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // WebSocket connection for live updates
  const { isConnected, lastMessage } = useWebSocket(
    token || null,
    itinerary?.share_link?.live_updates_enabled || false
  );

  useEffect(() => {
    if (token) {
      fetchItinerary();
    }
  }, [token]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'itinerary_updated') {
      console.log('[PublicItinerary] Received update');
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow">
          <svg
            className="w-16 h-16 text-muted mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-primary mb-2">Itinerary Not Found</h1>
          <p className="text-secondary">
            This itinerary link may have expired or been removed.
          </p>
        </div>
      </div>
    );
  }

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = API_URL.replace('/api/v1', '');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">{itinerary.trip_name}</h1>
              <p className="text-sm text-secondary">
                {new Date(itinerary.start_date).toLocaleDateString()} -{' '}
                {new Date(itinerary.end_date).toLocaleDateString()} •{' '}
                {itinerary.destination}
              </p>
            </div>

            {/* Live Updates Indicator */}
            {itinerary.share_link.live_updates_enabled && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="text-muted">
                  {isConnected ? 'Live Updates Active' : 'Connecting...'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">
            Welcome, {itinerary.client_name}!
          </h2>
          <p className="text-lg opacity-90 mb-6">
            Here's your personalized travel itinerary for {itinerary.destination}
          </p>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {itinerary.days.length} Day{itinerary.days.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>
                {itinerary.num_adults} Adult{itinerary.num_adults > 1 ? 's' : ''}
                {itinerary.num_children > 0 &&
                  `, ${itinerary.num_children} Child${itinerary.num_children > 1 ? 'ren' : ''}`}
              </span>
            </div>

            {itinerary.total_price && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>${itinerary.total_price}</span>
              </div>
            )}
          </div>

          {/* Last Updated Indicator */}
          {lastUpdated && (
            <div className="mt-4 text-sm opacity-80">
              ✨ Updated just now
            </div>
          )}
        </div>
      </div>

      {/* Day-by-Day Itinerary */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {itinerary.days.map((day) => {
            const dayDate = new Date(day.actual_date);

            return (
              <div key={day.id} id={`day-${day.day_number}`} className="scroll-mt-20">
                {/* Day Header */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-primary">
                      Day {day.day_number}
                    </h2>
                    <span className="text-lg text-secondary">
                      {dayDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {day.title && (
                    <h3 className="text-xl font-semibold text-secondary mb-2">{day.title}</h3>
                  )}
                  {day.notes && <p className="text-muted">{day.notes}</p>}
                </div>

                {/* Activities */}
                <div className="space-y-6">
                  {day.activities.length === 0 ? (
                    <p className="text-center py-8 text-muted">No activities scheduled for this day</p>
                  ) : (
                    day.activities.map((act, actIndex) => {
                      const primaryImage = act.images?.find((img) => img.is_primary) || act.images?.[0];

                      return (
                        <div
                          key={act.id || actIndex}
                          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="md:flex">
                            {/* Activity Image */}
                            {primaryImage && (
                              <div className="md:w-1/3">
                                <img
                                  src={`${baseUrl}${primaryImage.file_path}`}
                                  alt={act.name}
                                  className="w-full h-64 md:h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Activity Details */}
                            <div className={`p-6 ${primaryImage ? 'md:w-2/3' : 'w-full'}`}>
                              {/* Time */}
                              {act.time_slot && (
                                <div className="flex items-center gap-2 text-sm text-secondary-500 mb-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span className="font-medium">{act.time_slot}</span>
                                </div>
                              )}

                              {/* Activity Name */}
                              <h4 className="text-xl font-bold text-primary mb-2">{act.name}</h4>

                              {/* Location */}
                              {act.location && (
                                <div className="flex items-center gap-2 text-muted mb-3">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  <span>{act.location}</span>
                                </div>
                              )}

                              {/* Description */}
                              {act.short_description && (
                                <p className="text-secondary mb-3">{act.short_description}</p>
                              )}

                              {/* Custom Notes */}
                              {act.custom_notes && (
                                <div className="p-3 bg-blue-50 border-l-4 border-blue-500 mb-3">
                                  <p className="text-sm text-secondary">{act.custom_notes}</p>
                                </div>
                              )}

                              {/* Highlights */}
                              {act.highlights && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-primary mb-1">Highlights:</p>
                                  <ul className="list-disc list-inside text-sm text-secondary space-y-1">
                                    {act.highlights.split('\n').map((highlight, idx) => (
                                      <li key={idx}>{highlight}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Price */}
                              {act.custom_price && (
                                <div className="text-lg font-semibold text-primary">
                                  ${act.custom_price}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer - Agency Contact */}
      <footer className="bg-white border-t border-border mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-primary mb-3">Need Help?</h3>
            <p className="text-secondary mb-4">
              Contact your travel agent for any questions or changes to your itinerary
            </p>

            {/* TODO: Add agency contact details from itinerary.agency */}
            <div className="flex justify-center gap-6 text-sm text-secondary">
              <a href="mailto:support@travelagency.com" className="hover:text-primary transition-colors">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Email Us</span>
                </div>
              </a>

              <a href="tel:+1234567890" className="hover:text-primary transition-colors">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>Call Us</span>
                </div>
              </a>
            </div>

            <p className="text-xs text-muted mt-6">
              Powered by Travel SaaS Itinerary Builder
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicItinerary;
