/**
 * Sound Effects Utility
 *
 * Story 2.8: Child Views Today's Task List
 * Task 8: 实现儿童端游戏化元素
 *
 * Provides sound effects for gamification using Web Audio API
 * - Task completion sound
 * - Success sound
 * - Error sound
 * - Click sound
 */

type SoundType = 'complete' | 'success' | 'error' | 'click' | 'refresh';

// Audio context for playing sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a sound effect using Web Audio API
 * Generates simple synthesized sounds without external files
 */
export function playSound(type: SoundType): void {
  try {
    const ctx = getAudioContext();

    // Create oscillator for sound generation
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'complete':
        // Ascending chime (C-E-G-C arpeggio)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
        oscillator.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      case 'success':
        // Victory fanfare (three notes)
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.15); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.3); // G5
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        oscillator.start(now);
        oscillator.stop(now + 0.6);
        break;

      case 'error':
        // Low buzz
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.linearRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'click':
        // Short click
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      case 'refresh':
        // Swoosh sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.2);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        oscillator.start(now);
        oscillator.stop(now + 0.25);
        break;
    }
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
}

/**
 * Check if sound is enabled (stored in localStorage)
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const enabled = localStorage.getItem('child-sound-enabled');
  return enabled !== 'false'; // Default to true
}

/**
 * Toggle sound on/off
 */
export function toggleSound(): boolean {
  const current = isSoundEnabled();
  const newValue = !current;
  localStorage.setItem('child-sound-enabled', String(newValue));
  return newValue;
}

/**
 * Play sound only if enabled
 */
export function playSoundIfEnabled(type: SoundType): void {
  if (isSoundEnabled()) {
    playSound(type);
  }
}
