/**
 * Pull to Refresh Component
 *
 * Story 2.8: Child Views Today's Task List
 * Task 6.1: 实现下拉刷新手势
 *
 * Custom pull-to-refresh implementation for touch devices
 * - Visual feedback during pull
 * - Release to refresh
 * - Loading indicator during refresh
 */

'use client';

import { useState, useRef, TouchEvent, useEffect } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number; // Distance in px to trigger refresh (default 80)
  disabled?: boolean; // Disable pull-to-refresh
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    // Only trigger when at top of scroll
    const target = e.target as HTMLElement;
    const scrollTop = target.scrollTop || containerRef.current?.scrollTop || 0;

    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, (currentY.current - startY.current) * 0.5); // Reduce sensitivity

    // Only pull down (not up)
    if (distance > 0) {
      setPullDistance(Math.min(distance, threshold * 1.5)); // Cap at 1.5x threshold

      // Prevent default scroll behavior when pulling
      if (distance < threshold) {
        e.preventDefault();
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = async () => {
    if (!isPulling || disabled || isRefreshing) return;

    setIsPulling(false);

    if (pullDistance >= threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(0);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      // Reset pull distance with animation
      setPullDistance(0);
    }

    startY.current = 0;
    currentY.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsPulling(false);
      setPullDistance(0);
    };
  }, []);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const showRefreshIndicator = pullDistance > 20 || isRefreshing;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {showRefreshIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10"
          style={{
            height: `${Math.max(0, pullDistance)}px`,
            opacity: pullProgress,
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">刷新中...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-600">
              <span
                className="text-2xl transition-transform"
                style={{
                  transform: `rotate(${pullProgress * 360}deg)`,
                }}
              >
                🔄
              </span>
              {pullDistance > threshold / 2 && (
                <span className="text-sm font-medium">松开刷新</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform"
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
