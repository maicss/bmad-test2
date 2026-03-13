/**
 * Gamified Feedback Component
 *
 * Story 2.9: Child Marks Task Complete
 * Task 8: 实现任务状态动画和反馈
 *   - 8.1 实现状态变化过渡动画（使用CSS动画）
 *   - 8.2 实现音效播放
 *   - 8.3 实现震动反馈（如设备支持）
 *   - 8.4 实现游戏化元素（表情、"小助手"表扬）
 *
 * Provides gamified feedback for task completion:
 * - Celebration animation with confetti
 * - Sound effects
 * - Haptic feedback (vibration)
 * - Encouraging messages and emojis
 *
 * Source: Story 2.9 Dev Notes - Gamification
 */

'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useSoundEffects } from '@/lib/utils/sound-effects';

interface GamifiedFeedbackProps {
  /** Whether the feedback is visible */
  open: boolean;
  /** Callback when feedback closes */
  onClose: () => void;
  /** Type of feedback to show */
  type: 'success' | 'approval' | 'achievement' | 'error';
  /** Custom message to display */
  message?: string;
  /** Points awarded (for success/approval) */
  points?: number;
  /** Test ID prefix for E2E testing */
  testIdPrefix?: string;
}

// Encouraging messages for children
const SUCCESS_MESSAGES = [
  '太棒了！',
  '做得好！',
  '你真厉害！',
  '继续加油！',
  '完美完成！',
  '超级棒！',
];

const ACHIEVEMENT_MESSAGES = [
  '哇！里程碑达成！',
  '不可思议！',
  '你是小明星！',
  '太厉害了！',
];

// Emojis for celebration
const CELEBRATION_EMOJIS = [
  '🎉', '🌟', '⭐', '👏', '🎊', '💫', '✨', '🏆',
];

/**
 * Confetti particle component
 */
function ConfettiParticle({ delay }: { delay: number }) {
  const emoji = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];
  const left = Math.random() * 100;
  const duration = 2 + Math.random() * 2;

  return (
    <div
      className="absolute text-3xl animate-fall"
      style={{
        left: `${left}%`,
        top: '-20px',
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}s`,
      }}
    >
      {emoji}
    </div>
  );
}

/**
 * Gamified feedback overlay with celebration effects
 */
export function GamifiedFeedback({
  open,
  onClose,
  type,
  message,
  points,
  testIdPrefix = 'feedback',
}: GamifiedFeedbackProps) {
  const [confettiParticles, setConfettiParticles] = useState<number[]>([]);
  const { playSuccessChord, playAchievementFanfare, playError } = useSoundEffects();

  // Trigger celebration effects on open
  useEffect(() => {
    if (open) {
      // Generate confetti particles
      setConfettiParticles(Array.from({ length: 20 }, (_, i) => i));

      // Play sound effects
      if (type === 'success') {
        playSuccessChord();
      } else if (type === 'approval' || type === 'achievement') {
        playAchievementFanfare();
      } else if (type === 'error') {
        playError();
      }

      // Vibrate if supported
      if ('vibrate' in navigator) {
        if (type === 'success' || type === 'approval') {
          navigator.vibrate([100, 50, 100]);
        } else if (type === 'achievement') {
          navigator.vibrate([100, 50, 100, 50, 200]);
        }
      }

      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
        setConfettiParticles([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [open, type, onClose, playSuccessChord, playAchievementFanfare, playError]);

  if (!open) return null;

  // Get display message
  const displayMessage = message || (
    type === 'achievement'
      ? ACHIEVEMENT_MESSAGES[Math.floor(Math.random() * ACHIEVEMENT_MESSAGES.length)]
      : SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]
  );

  // Get main emoji
  const mainEmoji = type === 'achievement'
    ? '🏆'
    : type === 'success'
    ? '✨'
    : type === 'approval'
    ? '👍'
    : '😅';

  // Background gradient based on type
  const bgGradient = type === 'error'
    ? 'from-red-500 to-orange-500'
    : type === 'achievement'
    ? 'from-purple-500 to-pink-500'
    : 'from-green-500 to-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" data-testid={testIdPrefix}>
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiParticles.map((i) => (
          <ConfettiParticle key={i} delay={i * 50} />
        ))}
      </div>

      {/* Main feedback card */}
      <div className={`relative bg-gradient-to-br ${bgGradient} rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          aria-label="关闭"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Main emoji with animation */}
          <div className="text-8xl mb-4 animate-bounce-slow">
            {mainEmoji}
          </div>

          {/* Message */}
          <h2 className="text-3xl font-bold text-white mb-2">
            {displayMessage}
          </h2>

          {/* Points display */}
          {points !== undefined && points > 0 && (
            <div className="flex items-center gap-2 text-white text-2xl font-bold mt-2">
              <span>+</span>
              <span className="animate-pulse">{points}</span>
              <span>积分</span>
            </div>
          )}

          {/* Subtitle */}
          <p className="text-white/80 mt-4 text-lg">
            {type === 'achievement' && '你完成了一个重要的里程碑！'}
            {type === 'success' && '任务已提交，等待家长审批'}
            {type === 'approval' && '任务已通过审批，积分已到账'}
            {type === 'error' && '操作失败，请重试'}
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {CELEBRATION_EMOJIS.slice(0, 5).map((emoji, i) => (
            <span
              key={i}
              className="text-2xl opacity-50"
              style={{
                animation: `float 2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-fall {
          animation: fall linear forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Simple task completion toast for inline feedback
 */
export function TaskCompletionToast({
  show,
  message,
  points,
  onClose,
}: {
  show: boolean;
  message: string;
  points?: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <span className="font-medium">{message}</span>
        {points !== undefined && (
          <span className="font-bold">+{points}分</span>
        )}
      </div>
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
