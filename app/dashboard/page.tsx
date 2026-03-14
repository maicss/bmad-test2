'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Dashboard redirect page
 *
 * Redirects to appropriate dashboard based on user role:
 * - Parents: /parent
 * - Children: /child-dashboard
 */

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function checkUserRoleAndRedirect() {
      try {
        // Fetch user role from API
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          const userRole = data.user?.role;
          const familyId = data.user?.family_id;

          if (userRole === 'child') {
            router.replace('/child-dashboard');
          } else if (userRole === 'parent') {
            // Redirect to approval page with family_id
            router.replace(familyId ? `/approval?family_id=${familyId}` : '/approval');
          } else {
            // Admin or other roles
            router.replace(familyId ? `/approval?family_id=${familyId}` : '/approval');
          }
        } else {
          // Not authenticated, redirect to login
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        // Default to parent dashboard on error
        router.replace('/parent');
      }
    }

    checkUserRoleAndRedirect();
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
