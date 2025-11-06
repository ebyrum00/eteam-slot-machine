import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { wsClient } from './client';
import { apiClient } from '../api/client';
import type { StateChangedEvent } from '../../types/api';

export function useWebSocket() {
  const setGameState = useGameStore((state) => state.setGameState);
  const setIsConnected = useGameStore((state) => state.setIsConnected);

  useEffect(() => {
    // Fetch initial game state
    apiClient.getGameState()
      .then(setGameState)
      .catch((error) => console.error('Failed to fetch initial game state:', error));

    // Connect to WebSocket
    wsClient.connect();
    setIsConnected(true);

    // Subscribe to game updates
    const unsubscribe = wsClient.subscribe((event) => {
      if (event.event === 'state_changed') {
        const stateEvent = event as StateChangedEvent;

        setGameState({
          state: stateEvent.state,
          current_player_id: stateEvent.player_id,
          current_player_name: stateEvent.player_name,
          current_spin_id: stateEvent.spin_id,
          updated_at: new Date(stateEvent.timestamp * 1000).toISOString(),
        });
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      wsClient.disconnect();
      setIsConnected(false);
    };
  }, [setGameState, setIsConnected]);
}
