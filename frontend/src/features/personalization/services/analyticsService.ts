/**
 * Analytics Service for Personalization Feature
 * Tracks user interactions with the gamified discovery engine
 */

export type AnalyticsEventName =
  | 'personalization_entry_click'
  | 'personalization_session_start'
  | 'personalization_vibe_select'
  | 'personalization_vibe_deselect'
  | 'personalization_deck_start'
  | 'personalization_card_view'
  | 'personalization_card_swipe'
  | 'personalization_card_button_click'
  | 'personalization_card_expand'
  | 'personalization_deck_complete'
  | 'personalization_reveal_view'
  | 'personalization_swap_initiate'
  | 'personalization_swap_complete'
  | 'personalization_confirm_click'
  | 'personalization_confirm_success'
  | 'personalization_session_abandon'
  | 'personalization_session_resume'
  | 'personalization_error';

export interface AnalyticsEventPayload {
  // Common fields
  session_id?: string;
  token?: string;
  device_id?: string;
  timestamp?: number;

  // Vibe selection
  vibe_key?: string;
  selected_vibes?: string[];
  vibe_count?: number;

  // Card/Swipe events
  activity_id?: string;
  activity_name?: string;
  card_position?: number;
  action?: 'LIKE' | 'PASS' | 'SAVE';
  swipe_direction?: 'left' | 'right' | 'up';
  swipe_velocity?: number;
  seconds_viewed?: number;
  interaction_type?: 'swipe' | 'button';

  // Deck stats
  deck_size?: number;
  cards_viewed?: number;
  cards_liked?: number;
  cards_passed?: number;
  cards_saved?: number;
  completion_percentage?: number;

  // Reveal/Confirm events
  fitted_count?: number;
  missed_count?: number;
  saved_count?: number;
  total_price?: number;

  // Swap events
  remove_activity_id?: string;
  add_activity_id?: string;

  // Error tracking
  error_message?: string;
  error_code?: string;

  // Custom data
  [key: string]: unknown;
}

type AnalyticsListener = (event: AnalyticsEventName, payload: AnalyticsEventPayload) => void;

class AnalyticsService {
  private listeners: Set<AnalyticsListener> = new Set();
  private eventQueue: Array<{ event: AnalyticsEventName; payload: AnalyticsEventPayload }> = [];
  private isProcessing = false;
  private sessionStartTime: number | null = null;

  /**
   * Register an event listener
   */
  subscribe(listener: AnalyticsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Track an analytics event
   */
  track(event: AnalyticsEventName, payload: Partial<AnalyticsEventPayload> = {}) {
    const enrichedPayload: AnalyticsEventPayload = {
      ...payload,
      timestamp: Date.now(),
    };

    // Add session duration if session started
    if (this.sessionStartTime && event !== 'personalization_session_start') {
      enrichedPayload.session_duration_ms = Date.now() - this.sessionStartTime;
    }

    // Queue the event
    this.eventQueue.push({ event, payload: enrichedPayload });

    // Process queue
    this.processQueue();

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${event}`, enrichedPayload);
    }
  }

  /**
   * Process queued events
   */
  private processQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const item = this.eventQueue.shift();
      if (item) {
        this.notifyListeners(item.event, item.payload);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Notify all registered listeners
   */
  private notifyListeners(event: AnalyticsEventName, payload: AnalyticsEventPayload) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, payload);
      } catch (error) {
        console.error('[Analytics] Listener error:', error);
      }
    });
  }

  // Convenience methods for common events

  trackEntryClick(token: string) {
    this.track('personalization_entry_click', { token });
  }

  trackSessionStart(sessionId: string, token: string, deviceId: string, selectedVibes: string[]) {
    this.sessionStartTime = Date.now();
    this.track('personalization_session_start', {
      session_id: sessionId,
      token,
      device_id: deviceId,
      selected_vibes: selectedVibes,
      vibe_count: selectedVibes.length,
    });
  }

  trackVibeSelect(vibeKey: string, selectedVibes: string[]) {
    this.track('personalization_vibe_select', {
      vibe_key: vibeKey,
      selected_vibes: selectedVibes,
      vibe_count: selectedVibes.length,
    });
  }

  trackVibeDeselect(vibeKey: string, selectedVibes: string[]) {
    this.track('personalization_vibe_deselect', {
      vibe_key: vibeKey,
      selected_vibes: selectedVibes,
      vibe_count: selectedVibes.length,
    });
  }

  trackDeckStart(sessionId: string, deckSize: number) {
    this.track('personalization_deck_start', {
      session_id: sessionId,
      deck_size: deckSize,
    });
  }

  trackCardView(sessionId: string, activityId: string, activityName: string, cardPosition: number) {
    this.track('personalization_card_view', {
      session_id: sessionId,
      activity_id: activityId,
      activity_name: activityName,
      card_position: cardPosition,
    });
  }

  trackCardSwipe(
    sessionId: string,
    activityId: string,
    activityName: string,
    action: 'LIKE' | 'PASS' | 'SAVE',
    cardPosition: number,
    interactionType: 'swipe' | 'button',
    swipeVelocity?: number,
    secondsViewed?: number
  ) {
    this.track('personalization_card_swipe', {
      session_id: sessionId,
      activity_id: activityId,
      activity_name: activityName,
      action,
      card_position: cardPosition,
      interaction_type: interactionType,
      swipe_direction: action === 'LIKE' ? 'right' : action === 'PASS' ? 'left' : 'up',
      swipe_velocity: swipeVelocity,
      seconds_viewed: secondsViewed,
    });
  }

  trackCardButtonClick(
    sessionId: string,
    activityId: string,
    action: 'LIKE' | 'PASS' | 'SAVE',
    cardPosition: number
  ) {
    this.track('personalization_card_button_click', {
      session_id: sessionId,
      activity_id: activityId,
      action,
      card_position: cardPosition,
    });
  }

  trackCardExpand(sessionId: string, activityId: string, cardPosition: number) {
    this.track('personalization_card_expand', {
      session_id: sessionId,
      activity_id: activityId,
      card_position: cardPosition,
    });
  }

  trackDeckComplete(
    sessionId: string,
    stats: {
      deckSize: number;
      cardsLiked: number;
      cardsPassed: number;
      cardsSaved: number;
    }
  ) {
    this.track('personalization_deck_complete', {
      session_id: sessionId,
      deck_size: stats.deckSize,
      cards_liked: stats.cardsLiked,
      cards_passed: stats.cardsPassed,
      cards_saved: stats.cardsSaved,
      completion_percentage: 100,
    });
  }

  trackRevealView(
    sessionId: string,
    fittedCount: number,
    missedCount: number,
    savedCount: number,
    totalPrice: number
  ) {
    this.track('personalization_reveal_view', {
      session_id: sessionId,
      fitted_count: fittedCount,
      missed_count: missedCount,
      saved_count: savedCount,
      total_price: totalPrice,
    });
  }

  trackSwapInitiate(sessionId: string, removeActivityId: string, addActivityId: string) {
    this.track('personalization_swap_initiate', {
      session_id: sessionId,
      remove_activity_id: removeActivityId,
      add_activity_id: addActivityId,
    });
  }

  trackSwapComplete(sessionId: string, success: boolean) {
    this.track('personalization_swap_complete', {
      session_id: sessionId,
      success,
    });
  }

  trackConfirmClick(sessionId: string, totalPrice: number, activitiesCount: number) {
    this.track('personalization_confirm_click', {
      session_id: sessionId,
      total_price: totalPrice,
      fitted_count: activitiesCount,
    });
  }

  trackConfirmSuccess(sessionId: string, totalPrice: number, activitiesAdded: number) {
    this.track('personalization_confirm_success', {
      session_id: sessionId,
      total_price: totalPrice,
      fitted_count: activitiesAdded,
    });
  }

  trackSessionAbandon(sessionId: string, cardsViewed: number, deckSize: number) {
    this.track('personalization_session_abandon', {
      session_id: sessionId,
      cards_viewed: cardsViewed,
      deck_size: deckSize,
      completion_percentage: Math.round((cardsViewed / deckSize) * 100),
    });
  }

  trackSessionResume(sessionId: string, cardsViewed: number, deckSize: number) {
    this.sessionStartTime = Date.now();
    this.track('personalization_session_resume', {
      session_id: sessionId,
      cards_viewed: cardsViewed,
      deck_size: deckSize,
    });
  }

  trackError(errorMessage: string, errorCode?: string, sessionId?: string) {
    this.track('personalization_error', {
      session_id: sessionId,
      error_message: errorMessage,
      error_code: errorCode,
    });
  }

  /**
   * Reset session tracking
   */
  resetSession() {
    this.sessionStartTime = null;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export for testing
export { AnalyticsService };
