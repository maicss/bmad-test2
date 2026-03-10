/**
 * Gamified Feedback Component
 *
 * Story 2.8: Child Views Today's Task List
 * Task 8: 实现儿童端游戏化元素
 *
 * Provides visual and audio feedback for child interactions
 * - Task completion celebration
 * - Encouraging messages
 * - Animated feedback
 */

'use client';

import { useEffect, useState } from 'react';
import { playSoundIfEnabled } from '@/lib/utils/sound-effects';

export type FeedbackType = 'complete' | 'progress' | 'encourage' | 'celebrate';

interface Feedback {
  emoji: string;
  message: string;
  color: string;
}

const FEEDBACK_MESSAGES: Record<FeedbackType, Feedback[]> = {
  complete: [
    { emoji: '🎉', message: '太棒了！任务完成！', color: 'green' },
    { emoji: '⭐', message: '你真厉害！', color: 'yellow' },
    { emoji: '🏆', message: '做得好！', color: 'blue' },
    { emoji: '👏', message: '继续加油！', color: 'purple' },
    { emoji: '✨', message: '出色完成！', color: 'pink' },
  ],
  progress: [
    { emoji: '💪', message: '正在进行中...', color: 'blue' },
    { emoji: '🔥', message: '保持势头！', color: 'orange' },
    { emoji: '🌟', message: '做得不错！', color: 'yellow' },
  ],
  encourage: [
    { emoji: '💪', message: '你可以做到的！', color: 'blue' },
    { emoji: '🌈', message: '加油！', color: 'purple' },
    { emoji: '☀️', message: '相信自己！', color: 'yellow' },
  ],
  celebrate: [
    { emoji: '🎊', message: '全部完成！', color: 'green' },
    { emoji: '👑', message: '你是最棒的！', color: 'yellow' },
    { emoji: '🏅', message: '太厉害了！', color: 'blue' },
    { emoji: '💎', message: '完美完成！', color: 'purple' },
  ],
};

interface GamifiedFeedbackProps {
  type: FeedbackType;
  show: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function GamifiedFeedback({
  type,
  show,
  duration = 2000,
  onComplete,
}: GamifiedFeedbackProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Get random feedback message for the type
      const messages = FEEDBACK_MESSAGES[type];
      const randomFeedback = messages[Math.floor(Math.random() * messages.length)];
      setFeedback(randomFeedback);
      setIsVisible(true);

      // Play sound
      playSoundIfEnabled(type === 'complete' ? 'success' : 'click');

      // Auto-hide
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, type, duration, onComplete]);

  if (!isVisible || !feedback) return null;

  const colorClasses: Record<string, string> = {
    green: 'from-green-400 to-green-500',
    yellow: 'from-yellow-400 to-yellow-500',
    blue: 'from-blue-400 to-blue-500',
    purple: 'from-purple-400 to-purple-500',
    pink: 'from-pink-400 to-pink-500',
    orange: 'from-orange-400 to-orange-500',
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div
        className={`
          animate-in fade-in zoom-in duration-300
          bg-gradient-to-br ${colorClasses[feedback.color]}
          rounded-3xl shadow-2xl p-8 text-center
          transform transition-all
        `}
      >
        <div className="text-7xl mb-4 animate-bounce">
          {feedback.emoji}
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {feedback.message}
        </h2>
      </div>
    </div>
  );
}

/**
 * Hook to show gamified feedback
 */
export function useGamifiedFeedback() {
  const [feedback, setFeedback] = useState<{ type: FeedbackType; show: boolean }>({
    type: 'encourage',
    show: false,
  });

  const showFeedback = (type: FeedbackType) => {
    setFeedback({ type, show: true });
  };

  const hideFeedback = () => {
    setFeedback(prev => ({ ...prev, show: false }));
  };

  return {
    feedback,
    showFeedback,
    hideFeedback,
    showComplete: () => showFeedback('complete'),
    showProgress: () => showFeedback('progress'),
    showEncourage: () => showFeedback('encourage'),
    showCelebrate: () => showFeedback('celebrate'),
  };
}
