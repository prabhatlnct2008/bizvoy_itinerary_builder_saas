// Personalization Type Definitions - Aligned with Backend Schemas

export interface AgencyVibe {
  id: string;
  agency_id: string;
  vibe_key: string;
  display_name: string;
  emoji: string | null;
  color_hex: string | null;
  is_global: boolean;
  is_enabled: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

// Matches backend PersonalizationStatusResponse
export interface PersonalizationStatus {
  enabled: boolean;
  has_active_session: boolean;
  session: SessionResponse | null;
  available_vibes: AgencyVibe[];
  policy: string;
}

// Matches backend SessionResponse
export interface SessionResponse {
  id: string;
  itinerary_id: string;
  selected_vibes: string[] | null;
  deck_size: number;
  cards_viewed: number;
  cards_liked: number;
  cards_passed: number;
  cards_saved: number;
  total_time_seconds: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  last_interaction_at: string;
}

// Matches backend DeckCard
export interface DeckCard {
  activity_id: string;
  name: string;
  category_label: string | null;
  location_display: string | null;
  short_description: string | null;
  client_description: string | null;
  price_display: string | null;
  price_numeric: number | null;
  currency_code: string | null;
  rating: number | null;
  review_count: number;
  marketing_badge: string | null;
  vibe_tags: string[] | null;
  optimal_time_of_day: string | null;
  hero_image_url: string | null;
  highlights: string[] | null;
  gamification_readiness_score: number;
  card_position: number;
}

// Matches backend DeckResponse
export interface DeckResponse {
  session_id: string;
  cards: DeckCard[];
  total_cards: number;
  cards_remaining: number;
}

// Matches backend SwipeRequest
export interface SwipeRequest {
  activity_id: string;
  action: 'like' | 'pass' | 'save';
  seconds_viewed?: number;
  card_position?: number;
  swipe_velocity?: number;
}

// Matches backend SwipeResponse
export interface SwipeResponse {
  success: boolean;
  message: string;
  cards_remaining: number;
  cards_liked: number;
}

// Matches backend FittedItem
export interface FittedItem {
  cart_item_id: string;
  activity_id: string;
  activity_name: string;
  day_number: number;
  day_date: string;
  time_slot: string | null;
  fit_reason: string | null;
  quoted_price: number | null;
  currency_code: string;
}

// Matches backend MissedItem
export interface MissedItem {
  cart_item_id: string;
  activity_id: string;
  activity_name: string;
  miss_reason: string;
  swap_suggestion_activity_id: string | null;
  swap_suggestion_name: string | null;
}

// Matches backend RevealResponse
export interface RevealResponse {
  session_id: string;
  fitted_items: FittedItem[];
  missed_items: MissedItem[];
  total_liked: number;
  total_fitted: number;
  total_missed: number;
  message: string;
}

// Matches backend ConfirmRequest
export interface ConfirmRequest {
  cart_item_ids: string[];
}

// Matches backend ConfirmResponse
export interface ConfirmResponse {
  success: boolean;
  message: string;
  added_count: number;
  itinerary_id: string;
}

// Matches backend SwapRequest
export interface SwapRequest {
  cart_item_id: string;
  new_activity_id: string;
}

// Matches backend SwapResponse
export interface SwapResponse {
  success: boolean;
  message: string;
  new_cart_item_id: string | null;
  fit_status: string;
  fit_reason: string | null;
}

// Matches backend StartSessionRequest
export interface SessionStartRequest {
  selected_vibes: string[];
  device_id?: string;
}

// Session start returns SessionResponse from backend
export type SessionStartResponse = SessionResponse;

// UI State Types
export type PersonalizationStep = 'entry' | 'vibe-check' | 'deck' | 'loading' | 'reveal' | 'confirmed';

export interface PersonalizationState {
  currentStep: PersonalizationStep;
  sessionId: string | null;
  selectedVibes: string[];
  deviceId: string | null;
  deck: DeckCard[];
  currentCardIndex: number;
  swipeHistory: SwipeRequest[];
  revealData: RevealResponse | null;
}

// Legacy type aliases for backwards compatibility during transition
export type FitStatus = 'fit' | 'miss' | 'pending';
