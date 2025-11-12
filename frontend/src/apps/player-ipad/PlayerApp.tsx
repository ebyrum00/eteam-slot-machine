import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api/client';
import { useGameStore } from '../../lib/stores/gameStore';
import { PlayerRegistration } from './PlayerRegistration';
import { ThankYouScreen } from './ThankYouScreen';
import { ScreenTransition } from '../../components';
import type { Player } from '../../types/api';

type GameStep = 'registration' | 'thank_you';

export function PlayerApp() {
  const [step, setStep] = useState<GameStep>('registration');
  const [player, setPlayer] = useState<Player | null>(null);

  const setCurrentPlayer = useGameStore((state) => state.setCurrentPlayer);
  const gameState = useGameStore((state) => state.gameState);

  // Handle registration completion
  const handleRegistrationComplete = async (newPlayer: Player) => {
    setPlayer(newPlayer);
    setCurrentPlayer(newPlayer);

    await apiClient.updateGameState({
      state: 'ready',
      player_id: newPlayer.id,
      player_name: newPlayer.name,
    });

    setStep('thank_you');
  };

  // Listen for game state changes and auto-return to registration when game goes to idle
  useEffect(() => {
    if (gameState === 'idle' && step === 'thank_you') {
      // Game completed, reset to registration
      setStep('registration');
      setPlayer(null);
      setCurrentPlayer(null);
    }
  }, [gameState, step, setCurrentPlayer]);

  // Render current step
  switch (step) {
    case 'registration':
      return (
        <ScreenTransition transitionKey="registration">
          <PlayerRegistration onComplete={handleRegistrationComplete} />
        </ScreenTransition>
      );
    case 'thank_you':
      return player ? (
        <ScreenTransition transitionKey="thank_you">
          <ThankYouScreen player={player} />
        </ScreenTransition>
      ) : null;
    default:
      return null;
  }
}
