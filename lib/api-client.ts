/**
 * API Client with automatic 401/403 handling
 * 
 * When 401 (Unauthorized) is received, redirects to the appropriate login page
 * When 403 (Forbidden) is received, redirects to the appropriate home page
 */

import { ErrorCodes } from "./constant";

// Login page routes based on role or path
const LOGIN_ROUTES = {
  admin: "/admin/login",
  parent: "/family/login",
  child: "/family/login", // Children also use family login
  default: "/auth/login",
};

// Home page routes for each role
const HOME_ROUTES = {
  admin: "/admin",
  parent: "/parent",
  child: "/child",
  default: "/",
};

/**
 * Determine the appropriate login route based on the current path
 */
function getLoginRoute(currentPath: string = window.location.pathname): string {
  if (currentPath.startsWith("/admin")) {
    return LOGIN_ROUTES.admin;
  } else if (currentPath.startsWith("/parent")) {
    return LOGIN_ROUTES.parent;
  } else if (currentPath.startsWith("/child")) {
    return LOGIN_ROUTES.child;
  }
  return LOGIN_ROUTES.default;
}

/**
 * Handle API response errors
 */
function handleApiError(response: Response, currentPath: string): never {
  const data = response.json() as Promise<{ code?: string; message?: string; data?: { role?: string } }>;
  
  if (response.status === 401) {
    // Unauthorized - redirect to login
    const loginRoute = getLoginRoute(currentPath);
    window.location.href = `${loginRoute}?redirect=${encodeURIComponent(window.location.href)}`;
    throw new Error("Unauthorized - Redirecting to login");
  }
  
  if (response.status === 403) {
    // Forbidden - redirect based on role or path
    const role = data.then(d => d.data?.role || null).catch(() => null);
    let homeRoute = HOME_ROUTES.default;
    
    if (currentPath.startsWith("/admin")) {
      homeRoute = HOME_ROUTES.parent; // Admin trying to access should go to parent
    } else if (currentPath.startsWith("/parent")) {
      homeRoute = HOME_ROUTES.child; // Parent trying to access should go to child
    } else if (currentPath.startsWith("/child")) {
      homeRoute = HOME_ROUTES.default;
    }
    
    window.location.href = homeRoute;
    throw new Error("Forbidden - Redirecting to home");
  }
  
  throw new Error(`API Error: ${response.status}`);
}

/**
 * Fetch wrapper with automatic error handling
 */
export async function apiFetch(
  url: string,
  options?: RequestInit,
  skipErrorHandling?: boolean
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok && !skipErrorHandling) {
    if (response.status === 401 || response.status === 403) {
      handleApiError(response, window.location.pathname);
    }
  }

  return response;
}

/**
 * Fetch wrapper that returns null on 401 instead of redirecting
 * Useful for background data fetching
 */
export async function apiFetchSafe(
  url: string,
  options?: RequestInit
): Promise<Response | null> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    return null;
  }

  return response;
}

/**
 * Check if the current user is authenticated
 * Returns true if authenticated, false otherwise
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return !!data.user;
  } catch {
    return false;
  }
}

/**
 * Get the current user role from the session
 */
export async function getCurrentRole(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/session-check", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok || response.status === 401) {
      return null;
    }

    const data = await response.json();
    return data.data?.user?.role || null;
  } catch {
    return null;
  }
}

/**
 * Redirect to the appropriate login page based on current path or role
 */
export function redirectToLogin(currentPath?: string): void {
  const path = currentPath || window.location.pathname;
  const loginRoute = getLoginRoute(path);
  const currentUrl = window.location.href;
  window.location.href = `${loginRoute}?redirect=${encodeURIComponent(currentUrl)}`;
}

/**
 * Redirect to the appropriate home page based on role
 */
export function redirectToHome(role: string): void {
  const homeRoute = HOME_ROUTES[role as keyof typeof HOME_ROUTES] || HOME_ROUTES.default;
  window.location.href = homeRoute;
}
