'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Dashboard redirect page
 * 
 * Redirects to appropriate dashboard based on user role:
 * - Parents: /parent/dashboard (when implemented)
 * - Children: /child-dashboard
 */

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // For now, redirect to child dashboard
    // TODO: Implement role-based redirection when parent dashboard is available
    router.replace('/child-dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转到您的仪表板...</p>
      </div>
    </div>
  );
}
