/**
 * API authentication middleware and response helpers.
 *
 * Provides:
 * - withAuth: NextAuth session verification
 * - withErrorHandling: try/catch wrapper with standard error codes
 * - apiResponse/apiError: standard JSON response formatters
 * - handleApiError: maps errors to HTTP status codes
 *
 * @module lib/api-auth
 */

/**
 * Standard success response.
 *
 * @param data - Response data
 * @param meta - Optional pagination metadata
 * @returns Formatted response object
 */
export function apiResponse<T>(
  data: T,
  meta?: { total: number; page: number; limit: number }
): { data: T; meta?: { total: number; page: number; limit: number } } {
  const response: { data: T; meta?: { total: number; page: number; limit: number } } = { data };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

/**
 * Standard error response.
 *
 * @param code - Error code (NOT_FOUND, VALIDATION_ERROR, etc.)
 * @param message - Human-readable error message
 * @param details - Optional field-level error details
 * @returns Formatted error object
 */
export function apiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): { error: { code: string; message: string; details?: Record<string, unknown> } } {
  const error: { code: string; message: string; details?: Record<string, unknown> } = {
    code,
    message,
  };
  if (details) {
    error.details = details;
  }
  return { error };
}

/** Processed API error with status code */
export interface ApiErrorResult {
  status: number;
  body: ReturnType<typeof apiError>;
}

/**
 * Map an error to an HTTP status code and standard error body.
 *
 * @param error - Caught error
 * @returns Status code and formatted error body
 */
export function handleApiError(error: unknown): ApiErrorResult {
  // Prisma validation error
  if (
    error instanceof Error &&
    error.name === "PrismaClientValidationError"
  ) {
    return {
      status: 400,
      body: apiError("VALIDATION_ERROR", "Invalid request data"),
    };
  }

  // Prisma not found (P2025)
  if (
    error instanceof Error &&
    (error as unknown as Record<string, unknown>).code === "P2025"
  ) {
    return {
      status: 404,
      body: apiError("NOT_FOUND", "Record not found"),
    };
  }

  // Prisma unique constraint (P2002)
  if (
    error instanceof Error &&
    (error as unknown as Record<string, unknown>).code === "P2002"
  ) {
    return {
      status: 409,
      body: apiError("CONFLICT", "Record already exists"),
    };
  }

  // Unauthorized
  if (
    error instanceof Error &&
    error.message.includes("Unauthorized")
  ) {
    return {
      status: 401,
      body: apiError("UNAUTHORIZED", "Authentication required"),
    };
  }

  // Generic error
  console.error("[API Error]", error);
  return {
    status: 500,
    body: apiError(
      "INTERNAL_ERROR",
      "An unexpected error occurred"
    ),
  };
}

/**
 * Wrap an API handler with error handling.
 *
 * @param handler - Async handler function
 * @returns Wrapped handler that catches errors
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T | ApiErrorResult> {
  return handler().catch((error: unknown) => {
    return handleApiError(error);
  });
}
