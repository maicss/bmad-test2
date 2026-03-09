/**
 * Test App Setup for Integration Tests
 *
 * Creates a mock request handler for API route testing.
 * This allows testing API routes without starting a full dev server.
 *
 * Usage:
 * ```typescript
 * import { testRequest } from '@/tests/setup-test-app';
 *
 * const response = await testRequest({
 *   method: 'GET',
 *   url: '/api/users',
 *   headers: { cookie: 'session=xxx' }
 * });
 * ```
 */

import { NextRequest } from 'next/server';

/**
 * Mock response for testing API routes
 */
export interface MockResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
}

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest({
  method = 'GET',
  url = '/',
  headers = {},
  body = null,
  cookies = {},
}: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  cookies?: Record<string, string>;
} = {}): NextRequest {
  // Build URL with query params if present
  const urlObj = new URL(url, 'http://localhost:3000');

  // Create mock request
  const request = new NextRequest(urlObj.toString(), {
    method,
    headers: {
      ...headers,
      ...(Object.keys(cookies).length > 0 && {
        cookie: Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
      }),
    },
    body: body && (typeof body === 'string' ? body : JSON.stringify(body)),
  });

  return request;
}

/**
 * Test API route by importing and calling it directly
 *
 * @param routePath - Path to the route module (e.g., '@/app/api/users/route')
 * @param request - Mock request object
 * @returns Response object with status, body, headers
 */
export async function testApiRoute(
  routePath: string,
  request: NextRequest
): Promise<MockResponse> {
  try {
    // Dynamically import the route handler
    const routeModule = await import(routePath);

    // Select handler based on request method
    const method = request.method.toUpperCase();
    const handler = routeModule[method];

    if (!handler || typeof handler !== 'function') {
      throw new Error(`No ${method} handler found in ${routePath}`);
    }

    // Call the handler
    const response = await handler(request);

    // Get response body
    const contentType = response.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    // Convert headers to record
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      body,
      headers,
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Unknown error' },
      headers: {},
    };
  }
}

/**
 * Helper function to create a test request with supertest-like interface
 */
export async function testRequest(options: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  cookies?: Record<string, string>;
}): Promise<MockResponse> {
  const request = createMockRequest(options);

  // Convert URL to route path
  // e.g., /api/task-plans/for-quick-create -> @/app/api/task-plans/for-quick-create/route
  const url = new URL(options.url, 'http://localhost:3000');
  const pathname = url.pathname;
  const routePath = `@/app${pathname}/route`;

  return testApiRoute(routePath, request);
}
