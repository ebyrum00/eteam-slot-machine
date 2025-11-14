// frontend/src/utils/audioManager.ts

class AudioManager {
  private context: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🎵 AudioManager initialized. Context state:', this.context?.state);
    }
  }

  /**
   * Load an audio file
   */
  async loadSound(name: string, url: string): Promise<void> {
    if (!this.context) return;

    try {
      console.log(`Loading sound: ${name} from ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
      console.log(`✅ Successfully loaded sound: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to load sound: ${name} from ${url}`, error);
    }
  }

  /**
   * Resume audio context (needed for browser autoplay policies)
   */
  async resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      console.log('🎵 Resuming AudioContext from suspended state...');
      await this.context.resume();
      console.log('✅ AudioContext resumed. State:', this.context.state);
    } else if (this.context) {
      console.log('AudioContext already running. State:', this.context.state);
    }
  }

  /**
   * Play a sound
   */
  async play(name: string, volume: number = 1.0): Promise<void> {
    if (!this.context || this.muted) {
      console.log(`Not playing ${name}: context=${!!this.context}, muted=${this.muted}`);
      return;
    }

    // Resume context if suspended (browser autoplay policy)
    await this.resume();

    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.warn(`❌ Sound not loaded: ${name}. Available sounds:`, Array.from(this.sounds.keys()));
      return;
    }

    console.log(`🔊 Playing sound: ${name} at volume ${volume}`);
    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    source.start(0);
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Get mute state
   */
  isMuted(): boolean {
    return this.muted;
  }
}

// Singleton instance
export const audioManager = new AudioManager();

// Sound name constants
export const SOUNDS = {
  TICK: 'tick',
  REEL_STOP: 'reel-stop',
  WIN_NORMAL: 'win-normal',
  WIN_BIG: 'win-big',
  WIN_EPIC: 'win-epic',
  WIN_LEGENDARY: 'win-legendary',
} as const;

/**
 * Preload all sounds
 * Call this on app initialization
 */
export const preloadSounds = async (): Promise<void> => {
  console.log('🎵 preloadSounds() called');
  const soundsToLoad = [
    { name: SOUNDS.TICK, url: '/sounds/tick.wav' },
    { name: SOUNDS.REEL_STOP, url: '/sounds/reel-stop.wav' },
    { name: SOUNDS.WIN_NORMAL, url: '/sounds/win-normal.wav' },
    { name: SOUNDS.WIN_BIG, url: '/sounds/win-big.wav' },
    { name: SOUNDS.WIN_EPIC, url: '/sounds/win-epic.wav' },
    { name: SOUNDS.WIN_LEGENDARY, url: '/sounds/win-legendary.wav' },
  ];

  console.log(`🎵 Loading ${soundsToLoad.length} sounds...`);
  await Promise.all(
    soundsToLoad.map(({ name, url }) => audioManager.loadSound(name, url))
  );
  console.log('🎵 preloadSounds() completed');
};
