// Personalization Type Definitions

export interface AgencyVibe {
  id: string;
  agency_id: string;
  vibe_key: string;
  display_name: string;
  emoji: string;
  color_hex: string;
  is_global: boolean;
  is_enabled: boolean;
  display_order: number;
}

export interface PersonalizationStatus {
  enabled: boolean;
  completed: boolean;
  session_id: string | null;
  can_resume: boolean;
  available_vibes: AgencyVibe[];
  deck_size: number;
  destination: string;
}

export interface DeckCard {
  id: string;
  activity_id: string;
  name: string;
  location: string;
  short_description: string;
  detailed_description: string;
  highlights: string[];
  image_url: string;
  marketing_badge?: string;
  duration_display: string;
  price_numeric: number;
  currency_code: string;
  review_rating?: number;
  review_count?: number;
  category: string;
  position: number;
}

export interface SwipeRequest {
  session_id: string;
  activity_id: string;
  action: 'LIKE' | 'PASS' | 'SAVE';
  card_position: number;
  seconds_viewed: number;
  swipe_velocity?: number;
}

export interface SwipeResponse {
  success: boolean;
  remaining_cards: number;
  deck_completed: boolean;
}

export enum FitStatus {
  FITTED = 'FITTED',
  MISSED = 'MISSED',
  SAVED_FOR_LATER = 'SAVED_FOR_LATER'
}

export interface FittedItem {
  activity_id: string;
  name: string;
  image_url: string;
  day_number: number;
  day_date: string;
  time_slot: string;
  start_time?: string;
  end_time?: string;
  duration_display: string;
  price_numeric: number;
  currency_code: string;
  fit_status: FitStatus.FITTED;
  fit_reason: string;
  is_locked: boolean;
}

export interface MissedItem {
  activity_id: string;
  name: string;
  image_url: string;
  duration_display: string;
  price_numeric: number;
  currency_code: string;
  fit_status: FitStatus.MISSED;
  miss_reason: string;
  swap_suggestion?: {
    can_swap: boolean;
    swap_with_activity_id?: string;
    swap_with_activity_name?: string;
    swap_reason?: string;
  };
}

export interface SavedItem {
  activity_id: string;
  name: string;
  image_url: string;
  duration_display: string;
  price_numeric: number;
  currency_code: string;
  fit_status: FitStatus.SAVED_FOR_LATER;
}

export interface PaymentInfo {
  company_name: string;
  bank_name?: string;
  account_number?: string;
  routing_number?: string;
  qr_code_url?: string;
  payment_notes?: string;
}

export interface RevealResponse {
  session_id: string;
  itinerary_id: string;
  fitted_items: FittedItem[];
  missed_items: MissedItem[];
  saved_items: SavedItem[];
  total_added_price: number;
  currency_code: string;
  payment_info: PaymentInfo;
}

export interface ConfirmRequest {
  session_id: string;
}

export interface ConfirmResponse {
  success: boolean;
  itinerary_id: string;
  message: string;
  total_price_added: number;
  activities_added: number;
}

export interface SwapRequest {
  session_id: string;
  remove_activity_id: string;
  add_activity_id: string;
}

export interface SwapResponse {
  success: boolean;
  updated_reveal: RevealResponse;
}

export interface SessionStartRequest {
  selected_vibes: string[];
  device_id: string;
}

export interface SessionStartResponse {
  session_id: string;
  deck_size: number;
}

export interface DeckResponse {
  session_id: string;
  cards: DeckCard[];
  total_cards: number;
}

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
