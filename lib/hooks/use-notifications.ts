/**
 * Notification Polling Hook
 *
 * Story 2.10 Task 4: Implement real-time notifications
 * Subtask 4.3: Polling implementation (2-3 second intervals)
 *
 * Polls for new notifications at 2-3 second intervals per NFR4
 *
 * Source: Story 2.10 AC4 - 审批通过后积分变动通知立即推送给孩子（< 3秒）
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  metadata: string | null;
}

interface UseNotificationsOptions {
  /** Polling interval in milliseconds (default: 2500ms per NFR4) */
  interval?: number;
  /** Whether to only fetch unread notifications */
  unreadOnly?: boolean;
  /** Maximum number of notifications to fetch */
  limit?: number;
  /** Whether polling is enabled */
  enabled?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/**
 * Hook for polling notifications
 *
 * @param userId - User ID to fetch notifications for
 * @param options - Configuration options
 * @returns Notifications state and actions
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useNotifications('user-123', {
 *   interval: 2500, // Poll every 2.5 seconds (within NFR4's 3-second requirement)
 *   unreadOnly: false,
 *   limit: 20,
 *   enabled: true,
 * });
 * ```
 */
export function useNotifications(
  userId: string | null,
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    interval = 2500, // 2.5 seconds default (within NFR4's <3 second requirement)
    unreadOnly = false,
    limit = 20,
    enabled = true,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Track previous data to detect changes (for future optimizations)
  // const prevNotificationsRef = useRef<string>('');
  // const prevUnreadCountRef = useRef<number>(0);

  /**
   * Fetch notifications from server
   */
  const fetchNotifications = useCallback(async () => {
    if (!userId || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        unreadOnly: String(unreadOnly),
        limit: String(limit),
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Cookie': document.cookie,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId, unreadOnly, limit, enabled]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': document.cookie,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': document.cookie,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [userId]);

  // Set up polling
  useEffect(() => {
    if (!userId || !enabled) {
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Set up interval
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, interval);

    // Cleanup
    return () => clearInterval(pollInterval);
  }, [userId, interval, enabled, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}

/**
 * Hook for notification badge count only (lighter weight)
 */
export function useNotificationBadge(
  userId: string | null,
  options: Pick<UseNotificationsOptions, 'interval' | 'enabled'> = {}
): { unreadCount: number; isLoading: boolean } {
  const { interval = 3000, enabled = true } = options;
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!userId || !enabled) {
      return;
    }

    const fetchBadgeCount = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/notifications/unread-count`, {
          headers: {
            'Cookie': document.cookie,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notification count:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchBadgeCount();

    // Poll
    const pollInterval = setInterval(fetchBadgeCount, interval);

    return () => clearInterval(pollInterval);
  }, [userId, interval, enabled]);

  return { unreadCount, isLoading };
}
