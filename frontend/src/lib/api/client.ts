import type {
  Player,
  Spin,
  GameState,
  LeaderboardResponse,
  CreatePlayerRequest,
  UpdateGameStateRequest,
  ApplyBonusRequest,
} from '../../types/api';

// Auto-detect API URL based on current location
// If running on localhost, use localhost
// If running on network IP, use the same host but port 3000
const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const currentHost = window.location.hostname;
  return `http://${currentHost}:3000`;
};

const API_BASE_URL = getApiBaseUrl();

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.errors?.join(', ') || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Players
  async createPlayer(data: CreatePlayerRequest): Promise<Player> {
    return this.request<Player>('/api/players', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Game State
  async getGameState(): Promise<GameState> {
    return this.request<GameState>('/api/game_state');
  }

  async updateGameState(data: UpdateGameStateRequest): Promise<GameState> {
    return this.request<GameState>('/api/game_state', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Spins
  async createSpin(playerId: number): Promise<Spin> {
    return this.request<Spin>('/api/spins', {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId }),
    });
  }

  async getSpin(id: number): Promise<Spin> {
    return this.request<Spin>(`/api/spins/${id}`);
  }

  async applyBonus(id: number, data: ApplyBonusRequest): Promise<Spin> {
    return this.request<Spin>(`/api/spins/${id}/apply_bonus`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Leaderboard
  async getLeaderboard(): Promise<LeaderboardResponse> {
    return this.request<LeaderboardResponse>('/api/leaderboard');
  }
}

export const apiClient = new APIClient();
export default apiClient;
