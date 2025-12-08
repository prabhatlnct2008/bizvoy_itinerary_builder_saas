import apiClient from './client';

// ============================================================================
// MOCK DATA - Replace with actual API calls when backend is ready
// ============================================================================

const USE_MOCK_DATA = true; // Set to false when backend is ready

const MOCK_VIBES = [
  {
    id: '1',
    key: 'adventure',
    display_name: 'Adventure',
    emoji: '⛰️',
    color: '#f97316',
    enabled: true,
    is_custom: false,
    order: 1,
  },
  {
    id: '2',
    key: 'relaxation',
    display_name: 'Relaxation',
    emoji: '🏖️',
    color: '#06b6d4',
    enabled: true,
    is_custom: false,
    order: 2,
  },
  {
    id: '3',
    key: 'culture',
    display_name: 'Culture',
    emoji: '🏛️',
    color: '#8b5cf6',
    enabled: true,
    is_custom: false,
    order: 3,
  },
  {
    id: '4',
    key: 'foodie',
    display_name: 'Foodie',
    emoji: '🍽️',
    color: '#f59e0b',
    enabled: true,
    is_custom: false,
    order: 4,
  },
  {
    id: '5',
    key: 'nightlife',
    display_name: 'Nightlife',
    emoji: '🌃',
    color: '#6366f1',
    enabled: true,
    is_custom: false,
    order: 5,
  },
];

const MOCK_SETTINGS = {
  enabled: true,
  default_deck_size: 20,
  policy: 'balanced' as const,
  price_cap_per_traveler: 500,
  price_cap_per_day: 200,
  currency: 'USD',
  excluded_activity_types: [],
  show_readiness_warnings: true,
};

const MOCK_GAMIFICATION_STATUS = {
  total_activities: 42,
  game_ready_count: 16,
  game_ready_percentage: 38,
  issues: {
    missing_hero_image: 15,
    missing_price: 23,
    missing_vibe_tags: 8,
    missing_description: 4,
    missing_location: 2,
  },
  activities_by_readiness: {
    ready: [],
    partial: [],
    not_ready: [],
  },
};

const MOCK_AGENCY_ANALYTICS = {
  total_sessions: 247,
  completion_rate: 68,
  confirmation_rate: 52,
  total_revenue_added: 18640,
  sessions_over_time: [
    { date: '2025-12-01', count: 12 },
    { date: '2025-12-02', count: 18 },
    { date: '2025-12-03', count: 15 },
    { date: '2025-12-04', count: 22 },
    { date: '2025-12-05', count: 19 },
    { date: '2025-12-06', count: 25 },
    { date: '2025-12-07', count: 28 },
    { date: '2025-12-08', count: 24 },
  ],
  top_performing_activities: [
    { id: '1', name: 'Wine Tasting Tour', like_count: 85, pass_count: 12 },
    { id: '2', name: 'Sunset Boat Cruise', like_count: 78, pass_count: 15 },
    { id: '3', name: 'Cooking Class', like_count: 72, pass_count: 18 },
    { id: '4', name: 'Museum Tour', like_count: 45, pass_count: 25 },
    { id: '5', name: 'Beach Yoga', like_count: 38, pass_count: 32 },
  ],
  vibe_distribution: {
    adventure: 142,
    relaxation: 128,
    culture: 95,
    foodie: 156,
    nightlife: 67,
  },
};

const MOCK_ITINERARY_ANALYTICS = {
  itinerary_id: '',
  total_sessions: 12,
  completed_sessions: 9,
  confirmed_sessions: 7,
  abandoned_sessions: 3,
  completion_rate: 75,
  confirmation_rate: 58,
  avg_cards_liked: 8.5,
  avg_time_seconds: 320,
  total_revenue_added: 1240,
  most_liked_activities: [
    { id: '1', name: 'Wine Tasting', like_count: 8 },
    { id: '2', name: 'Sunset Cruise', like_count: 7 },
    { id: '3', name: 'Cooking Class', like_count: 6 },
  ],
  most_passed_activities: [
    { id: '4', name: 'Museum Tour', pass_count: 5 },
    { id: '5', name: 'Shopping Tour', pass_count: 4 },
  ],
  vibe_popularity: {
    foodie: 8,
    relaxation: 6,
    adventure: 4,
  },
  sessions_over_time: [],
};

// ============================================================================
// PERSONALIZATION SETTINGS
// ============================================================================

export const getPersonalizationSettings = async () => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_SETTINGS), 500));
  }
  const response = await apiClient.get('/api/v1/gamification/settings');
  return response.data;
};

export const updatePersonalizationSettings = async (settings: any) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve(settings), 500));
  }
  const response = await apiClient.put('/api/v1/gamification/settings', settings);
  return response.data;
};

// ============================================================================
// VIBES
// ============================================================================

export const getAgencyVibes = async () => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_VIBES), 500));
  }
  const response = await apiClient.get('/api/v1/gamification/vibes');
  return response.data;
};

export const createVibe = async (vibe: any) => {
  if (USE_MOCK_DATA) {
    const newVibe = {
      ...vibe,
      id: String(Date.now()),
      is_custom: true,
      enabled: true,
      order: MOCK_VIBES.length + 1,
    };
    return new Promise((resolve) => setTimeout(() => resolve(newVibe), 500));
  }
  const response = await apiClient.post('/api/v1/gamification/vibes', vibe);
  return response.data;
};

export const updateVibe = async (vibeId: string, vibe: any) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve(vibe), 500));
  }
  const response = await apiClient.put(`/api/v1/gamification/vibes/${vibeId}`, vibe);
  return response.data;
};

export const deleteVibe = async (vibeId: string) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve({}), 500));
  }
  const response = await apiClient.delete(`/api/v1/gamification/vibes/${vibeId}`);
  return response.data;
};

export const reorderVibes = async (vibeIds: string[]) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve({}), 500));
  }
  const response = await apiClient.post('/api/v1/gamification/vibes/reorder', {
    vibe_ids: vibeIds,
  });
  return response.data;
};

// ============================================================================
// ACTIVITY GAMIFICATION
// ============================================================================

export const updateActivityGamification = async (
  activityId: string,
  gamificationData: any
) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(gamificationData), 500)
    );
  }
  const response = await apiClient.put(
    `/api/v1/activities/${activityId}/gamification`,
    gamificationData
  );
  return response.data;
};

export const validateActivityGamification = async (activityId: string) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            score: 75,
            is_ready: true,
            issues: [],
          }),
        500
      )
    );
  }
  const response = await apiClient.get(
    `/api/v1/activities/${activityId}/gamification/validate`
  );
  return response.data;
};

// ============================================================================
// GAMIFICATION STATUS
// ============================================================================

export const getGamificationStatus = async () => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_GAMIFICATION_STATUS), 500)
    );
  }
  const response = await apiClient.get('/api/v1/gamification/status');
  return response.data;
};

// ============================================================================
// ANALYTICS
// ============================================================================

export const getItineraryAnalytics = async (itineraryId: string) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ ...MOCK_ITINERARY_ANALYTICS, itinerary_id: itineraryId }),
        500
      )
    );
  }
  const response = await apiClient.get(
    `/api/v1/gamification/analytics/itinerary/${itineraryId}`
  );
  return response.data;
};

export const getAgencyAnalytics = async () => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_AGENCY_ANALYTICS), 500)
    );
  }
  const response = await apiClient.get('/api/v1/gamification/analytics/agency');
  return response.data;
};
