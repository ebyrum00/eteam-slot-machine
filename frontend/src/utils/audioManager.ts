// frontend/src/utils/audioManager.ts

class AudioManager {
  private context: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private muted: boolean = false;
  private currentMusic: { source: AudioBufferSourceNode; gainNode: GainNode; name: string } | null = null;

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
    if (!this.context) {
      console.error(`❌ Cannot play ${name}: AudioContext not initialized`);
      return;
    }

    if (this.muted) {
      console.log(`🔇 Not playing ${name}: audio is muted`);
      return;
    }

    // Resume context if suspended (browser autoplay policy)
    await this.resume();

    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.error(`❌ Sound not loaded: ${name}. Available sounds:`, Array.from(this.sounds.keys()));
      return;
    }

    try {
      console.log(`🔊 Playing sound: ${name} at volume ${volume} (context state: ${this.context.state})`);
      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();

      source.buffer = buffer;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.context.destination);
      source.start(0);
      console.log(`✅ Successfully started playback of ${name}`);
    } catch (error) {
      console.error(`❌ Error playing sound ${name}:`, error);
    }
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

  /**
   * Play looping background music with fade in
   */
  async playMusic(name: string, volume: number = 0.3, fadeInDuration: number = 2): Promise<void> {
    if (!this.context) {
      console.error(`❌ Cannot play music ${name}: AudioContext not initialized`);
      return;
    }

    if (this.muted) {
      console.log(`🔇 Not playing music ${name}: audio is muted`);
      return;
    }

    // Resume context if suspended
    await this.resume();

    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.error(`❌ Music not loaded: ${name}`);
      return;
    }

    // Stop current music if playing
    if (this.currentMusic) {
      await this.stopMusic();
    }

    try {
      console.log(`🎵 Playing music: ${name} at volume ${volume} (looping)`);
      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();

      source.buffer = buffer;
      source.loop = true;

      // Start with volume at 0 for fade in
      gainNode.gain.value = 0;

      source.connect(gainNode);
      gainNode.connect(this.context.destination);
      source.start(0);

      // Fade in
      gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + fadeInDuration);

      this.currentMusic = { source, gainNode, name };
      console.log(`✅ Music started: ${name}`);
    } catch (error) {
      console.error(`❌ Error playing music ${name}:`, error);
    }
  }

  /**
   * Stop current background music with fade out
   */
  async stopMusic(fadeOutDuration: number = 1): Promise<void> {
    if (!this.currentMusic || !this.context) return;

    try {
      const { source, gainNode, name } = this.currentMusic;
      console.log(`🎵 Stopping music: ${name}`);

      // Fade out
      gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOutDuration);

      // Stop and disconnect after fade out
      setTimeout(() => {
        try {
          source.stop();
          source.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Ignore errors if already stopped
        }
      }, fadeOutDuration * 1000);

      this.currentMusic = null;
      console.log(`✅ Music stopped: ${name}`);
    } catch (error) {
      console.error(`❌ Error stopping music:`, error);
    }
  }

  /**
   * Switch to different background music with crossfade
   */
  async switchMusic(name: string, volume: number = 0.3, fadeOutDuration: number = 1, fadeInDuration: number = 2): Promise<void> {
    // Stop current music with fade out
    await this.stopMusic(fadeOutDuration);

    // Wait for fade out to complete before starting new music
    setTimeout(() => {
      this.playMusic(name, volume, fadeInDuration);
    }, fadeOutDuration * 1000);
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
  FEATURE_HIT_1: 'feature-hit-1',
  FEATURE_HIT_2: 'feature-hit-2',
  FEATURE_HIT_3: 'feature-hit-3',
  FEATURE_UNLOCKED: 'feature-unlocked',
  NOTIFICATION: 'notification',
  PAYOUT: 'payout',
  SMALL_HIT: 'small-hit',
  BIG_HIT: 'big-hit',
  MEDIUM_HIT: 'medium-hit',
  IDLE_MUSIC: 'idle-music',
  SPIN_MUSIC: 'spin-music',
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
    { name: SOUNDS.FEATURE_HIT_1, url: '/sounds/feature-hit-1.mp3' },
    { name: SOUNDS.FEATURE_HIT_2, url: '/sounds/feature-hit-2.mp3' },
    { name: SOUNDS.FEATURE_HIT_3, url: '/sounds/feature-hit-3.mp3' },
    { name: SOUNDS.FEATURE_UNLOCKED, url: '/sounds/feature-unlocked.mp3' },
    { name: SOUNDS.NOTIFICATION, url: '/sounds/notification.wav' },
    { name: SOUNDS.PAYOUT, url: '/sounds/payout.mp3' },
    { name: SOUNDS.SMALL_HIT, url: '/sounds/small-hit.wav' },
    { name: SOUNDS.BIG_HIT, url: '/sounds/big-hit.mp3' },
    { name: SOUNDS.MEDIUM_HIT, url: '/sounds/medium-hit.wav' },
    { name: SOUNDS.IDLE_MUSIC, url: '/sounds/idle-music.mp3' },
    { name: SOUNDS.SPIN_MUSIC, url: '/sounds/spin-music.mp3' },
  ];

  console.log(`🎵 Loading ${soundsToLoad.length} sounds...`);
  await Promise.all(
    soundsToLoad.map(({ name, url }) => audioManager.loadSound(name, url))
  );
  console.log(`✅ preloadSounds() completed. Total sounds loaded: ${audioManager['sounds'].size}`);
};

/**
 * Get the appropriate hit sound based on reel value
 */
export const getHitSoundForValue = (value: number): string => {
  // Banana (3M)
  if (value === 3_000_000) {
    return ''; // Bananas are handled separately with feature-hit sounds
  }
  // Big hit: >= 1M
  if (value >= 1_000_000) {
    return SOUNDS.BIG_HIT;
  }
  // Medium hit: 500K - 999K
  if (value >= 500_000) {
    return SOUNDS.MEDIUM_HIT;
  }
  // Small hit: < 500K
  return SOUNDS.SMALL_HIT;
};
