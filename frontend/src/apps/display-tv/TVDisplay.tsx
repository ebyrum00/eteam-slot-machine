import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { useGameStore } from '../../lib/stores/gameStore';
import { IdleLeaderboard } from './IdleLeaderboard';
import { WaitingScreen } from './WaitingScreen';
import { SpinningAnimation } from './SpinningAnimation';
import { ResultsScreen } from './ResultsScreen';
import { FullPageLoading, ScreenTransition } from '../../components';
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
      }, 5000); // Show results for 5 seconds before returning to leaderboard
    }
  }, [gameState, currentSpin]);

  // Show loading while fetching spin data
  if (isLoading && gameState?.state === 'spinning') {
    return <FullPageLoading message="Loading spin data..." />;
  }

  // Show loading on initial load
  if (!gameState) {
    return <FullPageLoading message="Connecting to game..." />;
  }

  // Render based on game state
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

    case 'results':
      return (
        <ScreenTransition transitionKey="results">
          {currentSpin && showResults ? (
            <ResultsScreen spin={currentSpin} />
          ) : currentSpin ? (
            <SpinningAnimation spin={currentSpin} />
          ) : (
            <FullPageLoading message="Loading results..." />
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
}
