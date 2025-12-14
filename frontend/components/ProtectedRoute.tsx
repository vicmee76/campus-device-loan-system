'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireStaff?: boolean;
  requireStudent?: boolean;
}

export default function ProtectedRoute({
  children,
  requireStaff = false,
  requireStudent = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isStaff, isStudent, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (requireStaff && !isStaff) {
        router.push('/dashboard');
        return;
      }

      if (requireStudent && !isStudent) {
        router.push('/staff');
        return;
      }
    }
  }, [isAuthenticated, isStaff, isStudent, isLoading, requireStaff, requireStudent, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireStaff && !isStaff) {
    return null;
  }

  if (requireStudent && !isStudent) {
    return null;
  }

  return <>{children}</>;
}


