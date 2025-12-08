import apiClient from './client';
import {
  PersonalizationStatus,
  SessionResponse,
  DeckResponse,
  SwipeRequest,
  SwipeResponse,
  RevealResponse,
  ConfirmRequest,
  ConfirmResponse,
  SwapRequest,
  SwapResponse,
  SessionStartRequest,
} from '../types/personalization';

// Use real API - mocks are disabled
const USE_MOCK_DATA = false;

// ============================================================================
// PERSONALIZATION STATUS
// ============================================================================

export const getPersonalizationStatus = async (token: string): Promise<PersonalizationStatus> => {
  const response = await apiClient.get<PersonalizationStatus>(
    `/api/v1/public/itinerary/${token}/personalization/status`
  );
  return response.data;
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export const startSession = async (
  token: string,
  selectedVibes: string[],
  deviceId?: string
): Promise<SessionResponse> => {
  const payload: SessionStartRequest = {
    selected_vibes: selectedVibes,
    device_id: deviceId,
  };

  const response = await apiClient.post<SessionResponse>(
    `/api/v1/public/itinerary/${token}/personalization/start`,
    payload
  );
  return response.data;
};

export const resumeSession = async (token: string): Promise<SessionResponse> => {
  const response = await apiClient.get<SessionResponse>(
    `/api/v1/public/itinerary/${token}/personalization/resume`
  );
  return response.data;
};

// ============================================================================
// DECK
// ============================================================================

export const getDeck = async (token: string): Promise<DeckResponse> => {
  const response = await apiClient.get<DeckResponse>(
    `/api/v1/public/itinerary/${token}/personalization/deck`
  );
  return response.data;
};

// ============================================================================
// SWIPE INTERACTIONS
// ============================================================================

export const recordSwipe = async (
  token: string,
  swipeData: SwipeRequest
): Promise<SwipeResponse> => {
  const response = await apiClient.post<SwipeResponse>(
    `/api/v1/public/itinerary/${token}/personalization/swipe`,
    swipeData
  );
  return response.data;
};

// ============================================================================
// COMPLETE & REVEAL
// ============================================================================

export const completePersonalization = async (
  token: string
): Promise<RevealResponse> => {
  const response = await apiClient.post<RevealResponse>(
    `/api/v1/public/itinerary/${token}/personalization/complete`
  );
  return response.data;
};

// ============================================================================
// CONFIRM SELECTIONS
// ============================================================================

export const confirmSelections = async (
  token: string,
  cartItemIds: string[]
): Promise<ConfirmResponse> => {
  const payload: ConfirmRequest = {
    cart_item_ids: cartItemIds,
  };

  const response = await apiClient.post<ConfirmResponse>(
    `/api/v1/public/itinerary/${token}/personalization/confirm`,
    payload
  );
  return response.data;
};

// ============================================================================
// SWAP ACTIVITY
// ============================================================================

export const swapActivity = async (
  token: string,
  swapData: SwapRequest
): Promise<SwapResponse> => {
  const response = await apiClient.post<SwapResponse>(
    `/api/v1/public/itinerary/${token}/personalization/swap`,
    swapData
  );
  return response.data;
};
