import axios from 'axios';
import {
  PersonalizationStatus,
  SessionStartRequest,
  SessionStartResponse,
  DeckResponse,
  SwipeRequest,
  SwipeResponse,
  RevealResponse,
  ConfirmRequest,
  ConfirmResponse,
  SwapRequest,
  SwapResponse,
} from '../types/personalization';
import {
  USE_MOCK_DATA,
  getMockPersonalizationStatus,
  MOCK_DECK_CARDS,
  MOCK_REVEAL_RESPONSE,
} from '../mocks/personalization';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Get personalization status for an itinerary
export const getPersonalizationStatus = async (token: string): Promise<PersonalizationStatus> => {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return getMockPersonalizationStatus(token);
  }

  const response = await axios.get<PersonalizationStatus>(
    `${API_BASE_URL}/public/itinerary/${token}/personalization/status`
  );
  return response.data;
};

// Start a new personalization session
export const startSession = async (
  token: string,
  selectedVibes: string[],
  deviceId: string
): Promise<SessionStartResponse> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      session_id: `mock-session-${Date.now()}`,
      deck_size: 15,
    };
  }

  const payload: SessionStartRequest = {
    selected_vibes: selectedVibes,
    device_id: deviceId,
  };

  const response = await axios.post<SessionStartResponse>(
    `${API_BASE_URL}/public/itinerary/${token}/personalization/start`,
    payload
  );
  return response.data;
};

// Get the deck of cards for swiping
export const getDeck = async (token: string, sessionId: string): Promise<DeckResponse> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      session_id: sessionId,
      cards: MOCK_DECK_CARDS,
      total_cards: MOCK_DECK_CARDS.length,
    };
  }

  const response = await axios.get<DeckResponse>(
    `${API_BASE_URL}/public/itinerary/${token}/personalization/deck`,
    {
      params: { session_id: sessionId },
    }
  );
  return response.data;
};

// Record a swipe action
export const recordSwipe = async (token: string, swipeData: SwipeRequest): Promise<SwipeResponse> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const remaining = MOCK_DECK_CARDS.length - swipeData.card_position;
    return {
      success: true,
      remaining_cards: remaining,
      deck_completed: remaining === 0,
    };
  }

  const response = await axios.post<SwipeResponse>(
    `${API_BASE_URL}/public/itinerary/${token}/personalization/swipe`,
    swipeData
  );
  return response.data;
};

// Complete the personalization and get reveal data
export const completePersonalization = async (
  token: string,
  sessionId: string
): Promise<RevealResponse> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    return MOCK_REVEAL_RESPONSE;
  }

  const response = await axios.post<RevealResponse>(
    `${API_BASE_URL}/public/itinerary/${token}/personalization/complete`,
    { session_id: sessionId }
  );
  return response.data;
};

// Confirm and persist the personalized selections
export const confirmSelections = async (
  token: string,
  sessionId: string
): Promise<ConfirmResponse> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      itinerary_id: 'mock-itinerary-456',
      message: 'Your personalized activities have been added to the itinerary!',
      total_price_added: MOCK_REVEAL_RESPONSE.total_added_price,
      activities_added: MOCK_REVEAL_RESPONSE.fitted_items.length,
    };
  }

  const payload: ConfirmRequest = {
    session_id: sessionId,
  };

  const response = await axios.post<ConfirmResponse>(
    `${API_BASE_URL}/public/itinerary/${token}/personalization/confirm`,
    payload
  );
  return response.data;
};

// Swap an activity (remove one, add another)
export const swapActivity = async (
  token: string,
  swapData: SwapRequest
): Promise<SwapResponse> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 800));
    // In mock mode, just return success with updated reveal data
    // In a real implementation, this would recalculate the fit
    return {
      success: true,
      updated_reveal: MOCK_REVEAL_RESPONSE,
    };
  }

  const response = await axios.post<SwapResponse>(
    `${API_BASE_URL}/public/itinerary/${token}/personalization/swap`,
    swapData
  );
  return response.data;
};

// Resume an existing session
export const resumeSession = async (token: string, deviceId: string): Promise<SessionStartResponse> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      session_id: `mock-session-${Date.now()}`,
      deck_size: 15,
    };
  }

  const response = await axios.get<SessionStartResponse>(
    `${API_BASE_URL}/public/itinerary/${token}/personalization/resume`,
    {
      params: { device_id: deviceId },
    }
  );
  return response.data;
};
