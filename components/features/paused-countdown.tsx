/**
 * Paused Countdown Component
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * Displays remaining pause time in a human-readable format.
 * Updates every minute to show countdown.
 *
 * Format: "X天Y小时Z分钟"
 */

'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface PausedCountdownProps {
  pausedUntil: Date | string | null;
  onResume?: () => void;
}

export function PausedCountdown({ pausedUntil, onResume }: PausedCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!pausedUntil) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const target = typeof pausedUntil === 'string'
        ? new Date(pausedUntil)
        : pausedUntil;

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        return '暂停已到期';
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}天`);
      if (hours > 0) parts.push(`${hours}小时`);
      if (minutes > 0 || parts.length === 0) parts.push(`${minutes}分钟`);

      return parts.join(' ');
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every minute
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [pausedUntil]);

  if (!pausedUntil) {
    return (
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <Clock className="h-3 w-3" />
        永久暂停
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
        <Clock className="h-3 w-3" />
        {timeLeft}
      </span>
      {onResume && timeLeft === '暂停已到期' && (
        <button
          onClick={onResume}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          立即恢复
        </button>
      )}
    </div>
  );
}
