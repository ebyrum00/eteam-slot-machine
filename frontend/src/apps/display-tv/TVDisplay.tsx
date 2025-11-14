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
import { audioManager } from '../../utils/audioManager';
import { motion, AnimatePresence } from 'framer-motion';

export function TVDisplay() {
  const gameState = useGameStore((state) => state.gameState);
  const [currentSpin, setCurrentSpin] = useState<Spin | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

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

  const handleEnableAudio = async () => {
    await audioManager.resume();
    setAudioEnabled(true);
  };

  return (
    <>
      {renderScreen()}
      <AudioToggle />

      {/* Audio Enable Overlay - shows on first load */}
      <AnimatePresence>
        {!audioEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center"
            onClick={handleEnableAudio}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-8xl mb-6"
              >
                🔊
              </motion.div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Click to Enable Sound
              </h2>
              <p className="text-xl text-gray-300">
                Tap anywhere to activate audio
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
