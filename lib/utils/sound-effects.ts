/**
 * Sound Effects Utility
 *
 * Story 2.9: Child Marks Task Complete
 * Task 8.2: 实现音效播放
 *
 * Provides sound effects for gamification using Web Audio API
 * - Success sounds for task completion
 * - Achievement sounds for milestones
 * - Error sounds for failures
 *
 * Uses browser's built-in Web Audio API - no external dependencies needed
 *
 * Source: Story 2.9 Dev Notes - Sound Effects
 */

/**
 * Sound effect types
 */
export type SoundEffectType =
  | 'success'      // Task completed successfully
  | 'approval'     // Task approved by parent
  | 'achievement'  // Milestone reached
  | 'error'        // Something went wrong
  | 'click';       // Button click

/**
 * Sound effects configuration
 */
interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const SOUND_CONFIGS: Record<SoundEffectType, SoundConfig> = {
  success: {
    frequency: 523.25,  // C5
    duration: 0.15,
    type: 'sine',
    volume: 0.3,
  },
  approval: {
    frequency: 659.25,  // E5
    duration: 0.2,
    type: 'sine',
    volume: 0.3,
  },
  achievement: {
    frequency: 783.99,  // G5
    duration: 0.3,
    type: 'sine',
    volume: 0.4,
  },
  error: {
    frequency: 200,     // Low tone
    duration: 0.2,
    type: 'sawtooth',
    volume: 0.2,
  },
  click: {
    frequency: 800,
    duration: 0.05,
    type: 'sine',
    volume: 0.1,
  },
};

/**
 * Sound Effects Manager using Web Audio API
 */
class SoundEffectsManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  /**
   * Get or create AudioContext
   */
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        console.warn('Web Audio API not supported');
        return null;
      }
    }

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(console.warn);
    }

    return this.audioContext;
  }

  /**
   * Play a sound effect
   *
   * @param type - Type of sound to play
   * @returns Promise that resolves when sound finishes
   */
  async play(type: SoundEffectType): Promise<void> {
    if (!this.enabled) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const config = SOUND_CONFIGS[type];

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);

      // Wait for sound to finish
      await new Promise(resolve => setTimeout(resolve, config.duration * 1000));
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  /**
   * Play a sequence of sounds (chord)
   *
   * @param types - Array of sound types to play in sequence
   */
  async playSequence(types: SoundEffectType[]): Promise<void> {
    for (const type of types) {
      await this.play(type);
      // Small delay between sounds
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Enable sound effects
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable sound effects
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Play success chord (ascending notes)
   */
  async playSuccessChord(): Promise<void> {
    await this.playSequence(['success', 'approval']);
  }

  /**
   * Play achievement fanfare (longer sequence)
   */
  async playAchievementFanfare(): Promise<void> {
    await this.playSequence(['success', 'approval', 'achievement']);
  }
}

// Singleton instance
export const soundEffects = new SoundEffectsManager();

/**
 * Hook for using sound effects in React components
 *
 * @returns Sound effects API
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { playSuccess, playError, enabled, toggle } = useSoundEffects();
 *
 *   const handleClick = () => {
 *     playSuccess();
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useSoundEffects() {
  return {
    playSuccess: () => soundEffects.play('success'),
    playApproval: () => soundEffects.play('approval'),
    playAchievement: () => soundEffects.play('achievement'),
    playError: () => soundEffects.play('error'),
    playClick: () => soundEffects.play('click'),
    playSuccessChord: () => soundEffects.playSuccessChord(),
    playAchievementFanfare: () => soundEffects.playAchievementFanfare(),
    enabled: soundEffects.isEnabled(),
    enable: () => soundEffects.enable(),
    disable: () => soundEffects.disable(),
    toggle: () => soundEffects.isEnabled() ? soundEffects.disable() : soundEffects.enable(),
  };
}
