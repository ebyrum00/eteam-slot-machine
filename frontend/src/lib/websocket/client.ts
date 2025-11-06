import { createConsumer, Consumer, Subscription } from '@rails/actioncable';
import type { StateChangedEvent, ButtonPressedEvent } from '../../types/api';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/cable';

type GameUpdateEvent = StateChangedEvent | ButtonPressedEvent;
type GameUpdateCallback = (event: GameUpdateEvent) => void;

class WebSocketClient {
  private consumer: Consumer | null = null;
  private subscription: Subscription | null = null;
  private callbacks: Set<GameUpdateCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    if (this.consumer) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket:', WS_URL);
    this.consumer = createConsumer(WS_URL);

    this.subscription = this.consumer.subscriptions.create(
      { channel: 'GameChannel' },
      {
        connected: () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
        },
        disconnected: () => {
          console.log('WebSocket disconnected');
          this.handleDisconnect();
        },
        received: (data: GameUpdateEvent) => {
          console.log('WebSocket received:', data);
          this.callbacks.forEach((callback) => callback(data));
        },
      }
    );
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.consumer) {
      this.consumer.disconnect();
      this.consumer = null;
    }

    console.log('WebSocket disconnected');
  }

  subscribe(callback: GameUpdateCallback) {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.disconnect();
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Helper to send button press (for testing)
  buttonPressed() {
    if (this.subscription) {
      this.subscription.perform('button_pressed');
    }
  }
}

export const wsClient = new WebSocketClient();
export default wsClient;

// Expose to window for testing in console
if (typeof window !== 'undefined') {
  (window as any).wsClient = wsClient;
}
