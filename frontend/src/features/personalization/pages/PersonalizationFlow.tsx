import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { VibeCheck } from '../components/VibeCheck';
import { SwipeDeck } from '../components/SwipeDeck';
import { MagicCrunch } from '../components/MagicCrunch';
import { RevealTimeline } from '../components/RevealTimeline';
import { usePersonalization } from '../hooks/usePersonalization';
import { useDeviceId } from '../hooks/useDeviceId';
import { getPersonalizationStatus } from '../../../api/personalization';

export const PersonalizationFlow = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { deviceId, loading: deviceIdLoading } = useDeviceId();
  const {
    state,
    loading,
    startSession,
    loadDeck,
    recordSwipe,
    completePersonalization,
    confirmSelections,
    swapActivity,
    goToStep,
  } = usePersonalization(token!);

  // Vibe/status data for the vibe check step
  const [vibesData, setVibesData] = React.useState<any>(null);

  // Load personalization status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getPersonalizationStatus(token!);

        if (!status.enabled) {
          toast.error('Personalization is not enabled for this trip');
          navigate(`/itinerary/${token}`);
          return;
        }

        if (status.completed) {
          toast.info('You have already personalized this trip');
          navigate(`/itinerary/${token}`);
          return;
        }

        // Could implement session resume here
        // if (status.can_resume && status.session_id) {
        //   await resumeSession(token!, deviceId!);
        // }
      } catch (error) {
        console.error('Failed to check personalization status:', error);
        toast.error('Failed to load personalization');
      }
    };

    if (token && !deviceIdLoading) {
      checkStatus();
    }
  }, [token, deviceIdLoading, navigate]);

  // Load vibes/status for the vibe check
  React.useEffect(() => {
    const loadVibes = async () => {
      try {
        const status = await getPersonalizationStatus(token!);
        setVibesData(status);
      } catch (error) {
        console.error('Failed to load vibes:', error);
      }
    };

    if (token) {
      loadVibes();
    }
  }, [token]);

  // Handle vibe check completion
  const handleVibeCheckComplete = async (selectedVibes: string[]) => {
    if (!deviceId) {
      toast.error('Device ID not ready');
      return;
    }

    try {
      const sessionResponse = await startSession(deviceId, selectedVibes);
      const deckResponse = await loadDeck(sessionResponse.session_id);

      if (deckResponse.cards.length === 0) {
        toast.error('No activities available for personalization');
        return;
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start personalization');
    }
  };

  // Handle swipe action
  const handleSwipe = async (cardId: string, action: 'LIKE' | 'PASS' | 'SAVE') => {
    if (!state.sessionId) return;

    try {
      const swipeData = {
        session_id: state.sessionId,
        activity_id: cardId,
        action,
        card_position: state.currentCardIndex,
        seconds_viewed: 5, // You could track actual viewing time
        swipe_velocity: 0,
      };

      await recordSwipe(swipeData);
    } catch (error) {
      console.error('Failed to record swipe:', error);
      // Don't show error to user, continue with flow
    }
  };

  // Handle deck completion
  const handleDeckComplete = async () => {
    if (!state.sessionId) return;

    try {
      await completePersonalization(state.sessionId);
    } catch (error) {
      console.error('Failed to complete personalization:', error);
      toast.error('Failed to process your choices');
    }
  };

  // Handle confirmation
  const handleConfirm = async () => {
    if (!state.sessionId) return;

    try {
      const response = await confirmSelections(state.sessionId);
      toast.success(response.message);

      // Navigate back to trip view
      setTimeout(() => {
        navigate(`/itinerary/${token}`);
      }, 2000);
    } catch (error) {
      console.error('Failed to confirm selections:', error);
      toast.error('Failed to confirm your selections');
    }
  };

  // Handle activity swap
  const handleSwap = async (removeActivityId: string, addActivityId: string) => {
    try {
      await swapActivity(removeActivityId, addActivityId);
      toast.success('Activity swapped successfully!');
    } catch (error) {
      console.error('Failed to swap activity:', error);
      toast.error('Failed to swap activity');
      throw error;
    }
  };

  // Show loading while device ID is being generated
  if (deviceIdLoading || !deviceId) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-white text-lg">Initializing...</div>
      </div>
    );
  }

  // Render current step
  switch (state.currentStep) {
    case 'entry':
    case 'vibe-check':
      if (!vibesData) {
        return (
          <div className="min-h-screen bg-game-bg flex items-center justify-center">
            <div className="text-white text-lg">Loading...</div>
          </div>
        );
      }
      return (
        <VibeCheck
          vibes={vibesData.available_vibes}
          destination={vibesData.destination}
          onContinue={handleVibeCheckComplete}
        />
      );

    case 'deck':
      if (state.deck.length === 0) {
        return (
          <div className="min-h-screen bg-game-bg flex items-center justify-center">
            <div className="text-white text-lg">Loading deck...</div>
          </div>
        );
      }
      return (
        <SwipeDeck
          deck={state.deck}
          onSwipe={handleSwipe}
          onComplete={handleDeckComplete}
        />
      );

    case 'loading':
      return <MagicCrunch />;

    case 'reveal':
      if (!state.revealData) {
        return (
          <div className="min-h-screen bg-game-bg flex items-center justify-center">
            <div className="text-white text-lg">Loading results...</div>
          </div>
        );
      }
      return (
        <RevealTimeline
          revealData={state.revealData}
          onConfirm={handleConfirm}
          onSwap={handleSwap}
          isLoading={loading}
        />
      );

    case 'confirmed':
      return (
        <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-white text-3xl font-bold mb-3">
              Trip Personalized!
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Your customized itinerary is ready
            </p>
            <p className="text-gray-400 text-sm">
              Redirecting you back to your trip...
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
};
