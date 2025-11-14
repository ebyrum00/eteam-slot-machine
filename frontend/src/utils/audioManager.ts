// frontend/src/utils/audioManager.ts

class AudioManager {
  private context: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Load an audio file
   */
  async loadSound(name: string, url: string): Promise<void> {
    if (!this.context) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }

  /**
   * Resume audio context (needed for browser autoplay policies)
   */
  async resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Play a sound
   */
  async play(name: string, volume: number = 1.0): Promise<void> {
    if (!this.context || this.muted) return;

    // Resume context if suspended (browser autoplay policy)
    await this.resume();

    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.warn(`Sound not loaded: ${name}`);
      return;
    }

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
  // TODO: Add actual sound files to /public/sounds/
  // For now, these will fail gracefully
  const soundsToLoad = [
    { name: SOUNDS.TICK, url: '/sounds/tick.mp3' },
    { name: SOUNDS.REEL_STOP, url: '/sounds/reel-stop.mp3' },
    { name: SOUNDS.WIN_NORMAL, url: '/sounds/win-normal.mp3' },
    { name: SOUNDS.WIN_BIG, url: '/sounds/win-big.mp3' },
    { name: SOUNDS.WIN_EPIC, url: '/sounds/win-epic.mp3' },
    { name: SOUNDS.WIN_LEGENDARY, url: '/sounds/win-legendary.mp3' },
  ];

  await Promise.all(
    soundsToLoad.map(({ name, url }) => audioManager.loadSound(name, url))
  );
};
