import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { useGameStore } from '../../lib/stores/gameStore';
import { IdleLeaderboard } from './IdleLeaderboard';
import { WaitingScreen } from './WaitingScreen';
import { SpinningAnimation } from './SpinningAnimation';
import { BonusWheel } from './BonusWheel';
import { ResultsScreen } from './ResultsScreen';
import { FullPageLoading, ScreenTransition, AudioToggle } from '../../components';
import { TRANSITION_TIMING } from '../../config';
import type { Spin } from '../../types/api';

export function TVDisplay() {
  const gameState = useGameStore((state) => state.gameState);
  const [currentSpin, setCurrentSpin] = useState<Spin | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Fetch current spin when spin_id changes
  const { data: spin, isLoading } = useQuery({
    queryKey: ['spin', gameState?.current_spin_id],
    queryFn: () => apiClient.getSpin(gameState!.current_spin_id!),
    enabled: !!gameState?.current_spin_id && !currentSpin,
  });

  useEffect(() => {
    if (spin) {
      setCurrentSpin(spin);
    }
  }, [spin]);

  // Initialize: ensure game state is idle when TV display first loads
  useEffect(() => {
    // Only run once on mount to reset state
    apiClient.updateGameState({ state: 'idle' }).catch(err => {
      console.error('Failed to reset game state:', err);
    });
  }, []);

  // Listen to game state changes
  useEffect(() => {
    if (!gameState) return;

    // When state changes to results, wait a moment then show results
    if (gameState.state === 'results' && currentSpin) {
      setTimeout(() => {
        setShowResults(true);
      }, 500);
    }

    // When state returns to idle, reset
    if (gameState.state === 'idle') {
      setTimeout(() => {
        setCurrentSpin(null);
        setShowResults(false);
      }, TRANSITION_TIMING.leaderboardReturn);
    }
  }, [gameState, currentSpin]);

  // Show loading while fetching spin data
  if (isLoading && gameState?.state === 'spinning') {
    return <FullPageLoading message="Loading spin data..." />;
  }

  // Show leaderboard on initial load instead of loading spinner
  if (!gameState) {
    return (
      <ScreenTransition transitionKey="initial-leaderboard">
        <IdleLeaderboard />
      </ScreenTransition>
    );
  }

  // Render based on game state
  const renderScreen = () => {
    switch (gameState.state) {
      case 'idle':
        return (
          <ScreenTransition transitionKey="idle">
            <IdleLeaderboard />
          </ScreenTransition>
        );

      case 'ready':
        return (
          <ScreenTransition transitionKey="ready">
            <WaitingScreen
              playerName={gameState.current_player_name || 'Player'}
            />
          </ScreenTransition>
        );

      case 'spinning':
        return (
          <ScreenTransition transitionKey="spinning">
            {currentSpin ? (
              <SpinningAnimation spin={currentSpin} />
            ) : (
              <FullPageLoading message="Generating spin..." />
            )}
          </ScreenTransition>
        );

      case 'bonus_wheel':
        return (
          <ScreenTransition transitionKey="bonus_wheel">
            {currentSpin ? (
              <BonusWheel spin={currentSpin} />
            ) : (
              <FullPageLoading message="Loading bonus..." />
            )}
          </ScreenTransition>
        );

      case 'results':
        return (
          <ScreenTransition transitionKey="results">
            {currentSpin && showResults ? (
              <ResultsScreen spin={currentSpin} />
            ) : (
              <SpinningAnimation spin={currentSpin!} />
            )}
          </ScreenTransition>
        );

      default:
        return (
          <ScreenTransition transitionKey="default">
            <IdleLeaderboard />
          </ScreenTransition>
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <AudioToggle />
    </>
  );
}
