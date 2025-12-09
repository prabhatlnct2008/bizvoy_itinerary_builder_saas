import { useState, useCallback, useRef } from 'react';
import {
  PersonalizationState,
  PersonalizationStep,
  SwipeRequest,
  DeckCard,
  RevealResponse,
} from '../../../types/personalization';
import * as personalizationApi from '../../../api/personalization';

/**
 * Custom hook for managing personalization flow state
 * Handles navigation between steps and API interactions
 */
export const usePersonalization = (token: string) => {
  const [state, setState] = useState<PersonalizationState>({
    currentStep: 'entry',
    sessionId: null,
    selectedVibes: [],
    deviceId: null,
    deck: [],
    currentCardIndex: 0,
    swipeHistory: [],
    revealData: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const completingRef = useRef(false);

  // Set device ID
  const setDeviceId = useCallback((deviceId: string) => {
    setState((prev) => ({ ...prev, deviceId }));
  }, []);

  // Set selected vibes
  const setSelectedVibes = useCallback((vibes: string[]) => {
    setState((prev) => ({ ...prev, selectedVibes: vibes }));
  }, []);

  // Start a new session
  const startSession = useCallback(async (deviceId: string, selectedVibes: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const response = await personalizationApi.startSession(token, selectedVibes, deviceId);
      const newSessionId = (response as any).session_id ?? (response as any).id;

      completingRef.current = false; // reset completion guard for new session
      setState((prev) => ({
        ...prev,
        sessionId: newSessionId,
        selectedVibes,
        deviceId,
        currentStep: 'deck',
      }));

      return { ...response, session_id: newSessionId };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load the deck
  const loadDeck = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await personalizationApi.getDeck(token, sessionId);

      setState((prev) => ({
        ...prev,
        deck: response.cards,
        currentCardIndex: 0,
      }));

      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Record a swipe
  const recordSwipe = useCallback(async (swipeData: SwipeRequest) => {
    try {
      console.log('[Personalization] recordSwipe payload', swipeData, 'currentIndex', state.currentCardIndex, 'deckLen', state.deck.length);
      const response = await personalizationApi.recordSwipe(token, swipeData);

      setState((prev) => ({
        ...prev,
        swipeHistory: [...prev.swipeHistory, swipeData],
        currentCardIndex: prev.currentCardIndex + 1,
      }));

      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [token]);

  // Complete personalization and get reveal data
  const completePersonalization = useCallback(async (sessionId: string) => {
    if (completingRef.current) {
      console.log('[Personalization] Complete already in progress, skipping');
      return;
    }

    completingRef.current = true;
    try {
      setLoading(true);
      setError(null);

      // Transition to loading screen
      setState((prev) => ({ ...prev, currentStep: 'loading' }));

      // Debug: trace complete call
      console.log('[Personalization] Completing session', sessionId);

      const revealData = await personalizationApi.completePersonalization(token, sessionId);

      console.log('[Personalization] Complete returned reveal data', revealData);

      setState((prev) => ({
        ...prev,
        revealData,
        currentStep: 'reveal',
      }));

      return revealData;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
      completingRef.current = false;
    }
  }, [token]);

  // Confirm selections
  const confirmSelections = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await personalizationApi.confirmSelections(token, sessionId);

      setState((prev) => ({
        ...prev,
        currentStep: 'confirmed',
      }));

      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Swap an activity
  const swapActivity = useCallback(async (removeActivityId: string, addActivityId: string) => {
    if (!state.sessionId) {
      throw new Error('No active session');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await personalizationApi.swapActivity(token, {
        session_id: state.sessionId,
        remove_activity_id: removeActivityId,
        add_activity_id: addActivityId,
      });

      // Update reveal data with the new swap result
      setState((prev) => ({
        ...prev,
        revealData: response.updated_reveal,
      }));

      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, state.sessionId]);

  // Navigate to a specific step
  const goToStep = useCallback((step: PersonalizationStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // Get current card
  const getCurrentCard = useCallback((): DeckCard | null => {
    if (state.currentCardIndex >= state.deck.length) {
      return null;
    }
    return state.deck[state.currentCardIndex];
  }, [state.deck, state.currentCardIndex]);

  // Check if deck is completed
  const isDeckCompleted = useCallback((): boolean => {
    return state.currentCardIndex >= state.deck.length;
  }, [state.deck.length, state.currentCardIndex]);

  return {
    state,
    loading,
    error,
    setDeviceId,
    setSelectedVibes,
    startSession,
    loadDeck,
    recordSwipe,
    completePersonalization,
    confirmSelections,
    swapActivity,
    goToStep,
    getCurrentCard,
    isDeckCompleted,
  };
};
