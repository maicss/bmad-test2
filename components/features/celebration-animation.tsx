/**
 * Celebration Animation Component
 *
 * Story 2.8: Child Views Today's Task List
 * Task 8: 实现儿童端游戏化元素
 *
 * Displays celebration animation when all tasks are completed
 * - Confetti particles
 * - Rainbow effects
 * - Emoji celebrations
 */

'use client';

import { useEffect, useState } from 'react';
import { playSoundIfEnabled } from '@/lib/utils/sound-effects';

interface CelebrationAnimationProps {
  show: boolean;
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  emoji?: string;
}

export function CelebrationAnimation({
  show,
  duration = 3000,
  onComplete,
}: CelebrationAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      playSoundIfEnabled('success');

      // Generate confetti particles
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E2', '#F8B500', '#FF69B4'
      ];

      const emojis = ['🎉', '⭐', '🌟', '✨', '🎊', '👏', '🏆', '💫'];

      const newParticles: Particle[] = [];

      // Create 50 confetti particles
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 10,
        });
      }

      // Create 10 emoji particles
      for (let i = 0; i < 10; i++) {
        newParticles.push({
          id: 50 + i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 1,
          vy: 1 + Math.random() * 2,
          color: 'transparent',
          size: 24,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
        });
      }

      setParticles(newParticles);

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  // Animate particles
  useEffect(() => {
    if (!isVisible || particles.length === 0) return;

    const animationInterval = setInterval(() => {
      setParticles(prevParticles =>
        prevParticles
          .map(p => ({
            ...p,
            x: p.x + p.vx * 0.5,
            y: p.y + p.vy * 0.5,
            vy: p.vy + 0.05, // gravity
          }))
          .filter(p => p.y < 120) // Remove particles off screen
      );
    }, 16); // ~60fps

    return () => clearInterval(animationInterval);
  }, [isVisible, particles.length > 0]);

  if (!isVisible || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.emoji ? `${particle.size}px` : `${particle.size}px`,
            height: particle.emoji ? `${particle.size}px` : `${particle.size}px`,
            backgroundColor: particle.emoji ? 'transparent' : particle.color,
            borderRadius: particle.emoji ? '0' : '50%',
            fontSize: particle.emoji ? `${particle.size}px` : '0',
            lineHeight: particle.emoji ? '1' : '0',
            transform: `rotate(${particle.id * 15}deg)`,
            opacity: 0.8,
          }}
        >
          {particle.emoji}
        </div>
      ))}

      {/* Celebration message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-bounce bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            太棒了！
          </h2>
          <p className="text-xl text-gray-600">
            所有任务都完成了！
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to trigger celebration animation
 */
export function useCelebration() {
  const [show, setShow] = useState(false);

  const celebrate = (duration?: number) => {
    setShow(true);
    if (duration) {
      setTimeout(() => setShow(false), duration);
    }
  };

  return { show, celebrate, setShow };
}
