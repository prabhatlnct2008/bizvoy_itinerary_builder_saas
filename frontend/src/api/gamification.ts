import apiClient from './client';

// ============================================================================
// MOCK DATA - Replace with actual API calls when backend is ready
// ============================================================================

const USE_MOCK_DATA = false; // Backend is ready - using real API

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

// Map frontend settings to backend schema
const mapSettingsToBackend = (settings: any) => ({
  is_enabled: settings.enabled,
  default_deck_size: settings.default_deck_size,
  personalization_policy: settings.policy,
  max_price_per_traveler: settings.price_cap_per_traveler,
  max_price_per_day: settings.price_cap_per_day,
  default_currency: settings.currency,
  allowed_activity_type_ids: settings.allowed_activity_type_ids || [],
  show_readiness_warnings: settings.show_readiness_warnings,
});

// Map backend settings to frontend schema
const mapSettingsFromBackend = (data: any) => ({
  enabled: data.is_enabled,
  default_deck_size: data.default_deck_size,
  policy: data.personalization_policy,
  price_cap_per_traveler: data.max_price_per_traveler,
  price_cap_per_day: data.max_price_per_day,
  currency: data.default_currency,
  allowed_activity_type_ids: data.allowed_activity_type_ids || [],
  show_readiness_warnings: data.show_readiness_warnings,
});

export const getPersonalizationSettings = async () => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_SETTINGS), 500));
  }
  const response = await apiClient.get('/agency/personalization/settings');
  return mapSettingsFromBackend(response.data);
};

export const updatePersonalizationSettings = async (settings: any) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve(settings), 500));
  }
  const response = await apiClient.put('/agency/personalization/settings', mapSettingsToBackend(settings));
  return mapSettingsFromBackend(response.data);
};

// ============================================================================
// VIBES
// ============================================================================

// Map backend vibe to frontend format
const mapVibeFromBackend = (data: any) => ({
  id: data.id,
  key: data.vibe_key,
  display_name: data.display_name,
  emoji: data.emoji,
  color: data.color_hex,
  enabled: data.is_enabled,
  is_custom: !data.is_global,
  order: data.display_order,
});

// Map frontend vibe to backend format for create
const mapVibeToBackendCreate = (vibe: any) => ({
  vibe_key: vibe.key,
  display_name: vibe.display_name,
  emoji: vibe.emoji,
  color_hex: vibe.color,
  is_enabled: vibe.enabled ?? true,
  display_order: vibe.order ?? 0,
});

// Map frontend vibe to backend format for update
const mapVibeToBackendUpdate = (vibe: any) => ({
  display_name: vibe.display_name,
  emoji: vibe.emoji,
  color_hex: vibe.color,
  is_enabled: vibe.enabled,
  display_order: vibe.order,
});

export const getAgencyVibes = async () => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_VIBES), 500));
  }
  const response = await apiClient.get('/agency/personalization/vibes');
  return response.data.map(mapVibeFromBackend);
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
  const response = await apiClient.post('/agency/personalization/vibes', mapVibeToBackendCreate(vibe));
  return mapVibeFromBackend(response.data);
};

export const updateVibe = async (vibeId: string, vibe: any) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve(vibe), 500));
  }
  const response = await apiClient.put(`/agency/personalization/vibes/${vibeId}`, mapVibeToBackendUpdate(vibe));
  return mapVibeFromBackend(response.data);
};

export const deleteVibe = async (vibeId: string) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve({}), 500));
  }
  const response = await apiClient.delete(`/agency/personalization/vibes/${vibeId}`);
  return response.data;
};

export const reorderVibes = async (vibeIds: string[]) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => setTimeout(() => resolve({}), 500));
  }
  const response = await apiClient.post('/agency/personalization/vibes/reorder', {
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
    `/activities/${activityId}/gamification`,
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
  const response = await apiClient.post(
    `/activities/${activityId}/gamification/validate`
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
  const response = await apiClient.get('/agency/activities/gamification-status');
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
    `/agency/analytics/itinerary/${itineraryId}`
  );
  return response.data;
};

export const getAgencyAnalytics = async () => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_AGENCY_ANALYTICS), 500)
    );
  }
  const response = await apiClient.get('/agency/analytics');
  return response.data;
};
