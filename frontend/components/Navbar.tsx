'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { deviceService } from '@/lib/api/device-service';
import { EmailNotification } from '@/lib/types';

export default function Navbar() {
  const { user, isAuthenticated, isStaff, isStudent, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && isStudent && user?.userId) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, isStudent, user?.userId]);

  const fetchUnreadCount = async () => {
    try {
      if (!user?.userId) return;
      const response = await deviceService.getEmailsByUserId(user.userId, { isRead: false });
      if (response.success && response.data) {
        setUnreadCount(response.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center px-2 py-2 text-xl font-bold text-primary-600">
              🎓 Campus Device Loan
            </Link>
            {isAuthenticated && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 sm:items-center">
                <Link
                  href={isStaff ? "/staff" : "/dashboard"}
                  className="px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
                >
                  {isStaff ? "Staff Dashboard" : "Student Dashboard"}
                </Link>
                <Link
                  href="/available-devices"
                  className="px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
                >
                  Available Devices
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {isStudent && (
                  <Link
                    href="/notifications"
                    className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
                    title="Notifications"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName} (<span className="font-bold capitalize">{user?.role}</span>)
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


