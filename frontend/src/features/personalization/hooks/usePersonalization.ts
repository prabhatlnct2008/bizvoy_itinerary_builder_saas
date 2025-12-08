import { useState, useCallback, useRef } from 'react';
import {
  PersonalizationState,
  PersonalizationStep,
  SwipeRequest,
  DeckCard,
  RevealResponse,
} from '../../../types/personalization';
import * as personalizationApi from '../../../api/personalization';
import { analyticsService } from '../services/analyticsService';

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

  // Track card view timing
  const cardViewStartTime = useRef<number>(Date.now());

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

      // Track session start
      analyticsService.trackSessionStart(response.session_id, token, deviceId, selectedVibes);

      setState((prev) => ({
        ...prev,
        sessionId: response.session_id,
        selectedVibes,
        deviceId,
        currentStep: 'deck',
      }));

      return response;
    } catch (err) {
      analyticsService.trackError((err as Error).message, 'SESSION_START_FAILED');
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

      // Track deck start
      analyticsService.trackDeckStart(sessionId, response.cards.length);

      // Track first card view
      if (response.cards.length > 0) {
        cardViewStartTime.current = Date.now();
        analyticsService.trackCardView(
          sessionId,
          response.cards[0].activity_id,
          response.cards[0].name,
          0
        );
      }

      setState((prev) => ({
        ...prev,
        deck: response.cards,
        currentCardIndex: 0,
      }));

      return response;
    } catch (err) {
      analyticsService.trackError((err as Error).message, 'DECK_LOAD_FAILED', sessionId);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Record a swipe
  const recordSwipe = useCallback(async (
    swipeData: SwipeRequest,
    interactionType: 'swipe' | 'button' = 'swipe'
  ) => {
    try {
      // Calculate viewing time
      const secondsViewed = Math.round((Date.now() - cardViewStartTime.current) / 1000);

      const response = await personalizationApi.recordSwipe(token, swipeData);

      setState((prev) => {
        const newIndex = prev.currentCardIndex + 1;

        // Track the swipe
        const currentCard = prev.deck[prev.currentCardIndex];
        if (currentCard) {
          analyticsService.trackCardSwipe(
            swipeData.session_id,
            swipeData.activity_id,
            currentCard.name,
            swipeData.action,
            swipeData.card_position,
            interactionType,
            swipeData.swipe_velocity,
            secondsViewed
          );
        }

        // Track next card view if there is one
        if (newIndex < prev.deck.length) {
          const nextCard = prev.deck[newIndex];
          cardViewStartTime.current = Date.now();
          analyticsService.trackCardView(
            swipeData.session_id,
            nextCard.activity_id,
            nextCard.name,
            newIndex
          );
        }

        return {
          ...prev,
          swipeHistory: [...prev.swipeHistory, swipeData],
          currentCardIndex: newIndex,
        };
      });

      return response;
    } catch (err) {
      analyticsService.trackError((err as Error).message, 'SWIPE_RECORD_FAILED', swipeData.session_id);
      setError(err as Error);
      throw err;
    }
  }, [token]);

  // Complete personalization and get reveal data
  const completePersonalization = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Track deck completion before transitioning
      setState((prev) => {
        const likedCount = prev.swipeHistory.filter((s) => s.action === 'LIKE').length;
        const passedCount = prev.swipeHistory.filter((s) => s.action === 'PASS').length;
        const savedCount = prev.swipeHistory.filter((s) => s.action === 'SAVE').length;

        analyticsService.trackDeckComplete(sessionId, {
          deckSize: prev.deck.length,
          cardsLiked: likedCount,
          cardsPassed: passedCount,
          cardsSaved: savedCount,
        });

        return { ...prev, currentStep: 'loading' };
      });

      const revealData = await personalizationApi.completePersonalization(token, sessionId);

      // Track reveal view
      analyticsService.trackRevealView(
        sessionId,
        revealData.fitted_items.length,
        revealData.missed_items.length,
        revealData.saved_items.length,
        revealData.total_added_price
      );

      setState((prev) => ({
        ...prev,
        revealData,
        currentStep: 'reveal',
      }));

      return revealData;
    } catch (err) {
      analyticsService.trackError((err as Error).message, 'COMPLETE_FAILED', sessionId);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Confirm selections
  const confirmSelections = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Track confirm click
      setState((prev) => {
        if (prev.revealData) {
          analyticsService.trackConfirmClick(
            sessionId,
            prev.revealData.total_added_price,
            prev.revealData.fitted_items.length
          );
        }
        return prev;
      });

      const response = await personalizationApi.confirmSelections(token, sessionId);

      // Track confirm success
      analyticsService.trackConfirmSuccess(
        sessionId,
        response.total_price_added,
        response.activities_added
      );

      // Reset analytics session
      analyticsService.resetSession();

      setState((prev) => ({
        ...prev,
        currentStep: 'confirmed',
      }));

      return response;
    } catch (err) {
      analyticsService.trackError((err as Error).message, 'CONFIRM_FAILED', sessionId);
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

      // Track swap initiate
      analyticsService.trackSwapInitiate(state.sessionId, removeActivityId, addActivityId);

      const response = await personalizationApi.swapActivity(token, {
        session_id: state.sessionId,
        remove_activity_id: removeActivityId,
        add_activity_id: addActivityId,
      });

      // Track swap complete
      analyticsService.trackSwapComplete(state.sessionId, true);

      // Update reveal data with the new swap result
      setState((prev) => ({
        ...prev,
        revealData: response.updated_reveal,
      }));

      return response;
    } catch (err) {
      analyticsService.trackSwapComplete(state.sessionId!, false);
      analyticsService.trackError((err as Error).message, 'SWAP_FAILED', state.sessionId!);
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
