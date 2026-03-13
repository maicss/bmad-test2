/**
 * Error Handler Utility
 *
 * Story 2.9: Child Marks Task Complete
 * Task 10: 实现错误处理和用户反馈
 *
 * Provides user-friendly error handling with:
 * - Toast notifications for errors
 * - Network error detection
 * - Retry mechanisms
 * - Child-friendly error messages
 *
 * Source: CLAUDE.md - Error Handling Requirements
 */

import { toast } from 'sonner';

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTH = 'auth',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * Child-friendly error messages
 */
const CHILD_FRIENDLY_MESSAGES: Record<ErrorType, { title: string; description: string }> = {
  [ErrorType.NETWORK]: {
    title: '网络连接失败',
    description: '请检查网络连接后重试',
  },
  [ErrorType.VALIDATION]: {
    title: '输入有误',
    description: '请检查填写的内容是否正确',
  },
  [ErrorType.AUTH]: {
    title: '需要登录',
    description: '请先登录后再试',
  },
  [ErrorType.NOT_FOUND]: {
    title: '找不到内容',
    description: '该内容可能已被删除',
  },
  [ErrorType.SERVER]: {
    title: '服务器出错了',
    description: '请稍后重试',
  },
  [ErrorType.UNKNOWN]: {
    title: '操作失败',
    description: '请重试或联系家长',
  },
};

/**
 * Detect error type from error object or response
 */
function detectErrorType(error: unknown, response?: Response): ErrorType {
  // Network errors (no response)
  if (!response && error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('timeout')) {
      return ErrorType.NETWORK;
    }
  }

  // HTTP status codes
  if (response) {
    switch (response.status) {
      case 401:
      case 403:
        return ErrorType.AUTH;
      case 404:
        return ErrorType.NOT_FOUND;
      case 400:
        return ErrorType.VALIDATION;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorType.SERVER;
      default:
        return ErrorType.UNKNOWN;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get child-friendly error message
 */
function getErrorMessage(type: ErrorType, customMessage?: string): { title: string; description: string } {
  if (customMessage) {
    return { title: CHILD_FRIENDLY_MESSAGES[type].title, description: customMessage };
  }
  return CHILD_FRIENDLY_MESSAGES[type];
}

/**
 * Show error toast with child-friendly message
 *
 * @param error - Error object or message
 * @param response - Optional Response object for HTTP errors
 * @param customMessage - Optional custom error message
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */
export function handleError(error: unknown, response?: Response, customMessage?: string): void {
  console.error('Error occurred:', error);

  const errorType = detectErrorType(error, response);
  const { title, description } = getErrorMessage(errorType, customMessage);

  toast.error(title, {
    description,
  });
}

/**
 * Show success toast
 *
 * @param title - Success message title
 * @param description - Optional description
 */
export function handleSuccess(title: string, description?: string): void {
  toast.success(title, {
    description,
  });
}

/**
 * Retry wrapper with exponential backoff
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delay - Initial delay in ms (default: 1000)
 * @returns Promise with result or throws error after max retries
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   3,
 *   1000
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on validation or auth errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('unauthorized') || message.includes('validation')) {
          throw error;
        }
      }

      // Wait before retrying with exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError!;
}

/**
 * Network status checker
 */
export const networkStatus = {
  /**
   * Check if browser is online
   */
  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  },

  /**
   * Listen for online/offline events
   */
  onChange(callback: (online: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
};
