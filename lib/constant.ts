/**
 * Error codes and response formats
 * Following AGENTS.md Error Handling standards
 */

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: any;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export const ErrorCodes = {
  // 4xx Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // 5xx Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Domain Specific Errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FAMILY_NOT_FOUND: 'FAMILY_NOT_FOUND',
  FAMILY_LIMIT_REACHED: 'FAMILY_LIMIT_REACHED',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  WISH_NOT_FOUND: 'WISH_NOT_FOUND',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): ApiErrorResponse {
  return { code, message, details };
}

export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}
