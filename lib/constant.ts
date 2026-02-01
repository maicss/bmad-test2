/**
 * Constants and error handling utilities
 */

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export function createErrorResponse(
  code: string,
  message: string,
  details?: any
) {
  return {
    success: false,
    code,
    message,
    ...(details !== undefined && { details }),
  };
}

export function createSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
  };
}
