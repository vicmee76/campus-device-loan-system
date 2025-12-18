'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deviceService } from '@/lib/api/device-service';
import { EmailNotification, ApiResponse } from '@/lib/types';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [allNotifications, setAllNotifications] = useState<EmailNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotification, setSelectedNotification] = useState<EmailNotification | null>(null);

  // Filter notifications based on current filter
  const notifications = allNotifications.filter((notif) => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  // Clear selected notification when filter changes if it's not in the filtered list
  useEffect(() => {
    if (selectedNotification) {
      const isSelectedInList = notifications.find(n => n.emailId === selectedNotification.emailId);
      if (!isSelectedInList) {
        setSelectedNotification(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      fetchNotifications();
    }
  }, [isAuthenticated, user?.userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.userId) return;

      // Fetch all notifications to get accurate counts
      const response: ApiResponse<EmailNotification[]> = await deviceService.getEmailsByUserId(
        user.userId
      );

      if (response.success && response.data) {
        setAllNotifications(response.data);
      } else {
        setError(response.message || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (emailId: string) => {
    try {
      const response = await deviceService.markEmailAsRead(emailId);
      if (response.success) {
        // Update local state
        setAllNotifications((prev) =>
          prev.map((notif) =>
            notif.emailId === emailId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getDay()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${day} ${displayHours}:${displayMinutes} ${ampm}`;
  };

  const getPreviewText = (body: string, maxLength: number = 80) => {
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength).trim() + '...';
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNotificationClick = (notification: EmailNotification) => {
    setSelectedNotification(notification);
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.emailId);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Notifications</h1>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All ({allNotifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'unread'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Unread ({allNotifications.filter(n => !n.isRead).length})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'read'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Read ({allNotifications.filter(n => n.isRead).length})
            </button>
          </nav>
        </div>

        {error ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              {filter === 'all'
                ? "You don't have any notifications yet."
                : filter === 'unread'
                ? "You don't have any unread notifications."
                : "You don't have any read notifications."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Email List */}
            <div className="bg-white rounded-lg shadow divide-y divide-gray-200 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.emailId}
                  className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedNotification?.emailId === notification.emailId
                      ? 'bg-primary-50 border-l-4 border-primary-600'
                      : !notification.isRead
                      ? 'bg-white'
                      : 'bg-gray-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex-shrink-0">
                          {!notification.isRead && (
                            <span className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {notification.status === 'failed' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                                Failed
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm truncate ${
                              notification.isRead ? 'text-gray-600 font-normal' : 'text-gray-900 font-semibold'
                            }`}
                          >
                            {notification.subject}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {getPreviewText(notification.body, 100)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column - Email Details */}
            <div className="bg-white rounded-lg shadow">
              {selectedNotification ? (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {!selectedNotification.isRead && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              Unread
                            </span>
                          )}
                          {selectedNotification.status === 'failed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Failed
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {selectedNotification.subject}
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 text-sm text-gray-500">
                      <div>
                        <span className="font-medium text-gray-700">To:</span> {selectedNotification.emailAddress}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Sent:</span> {formatFullDate(selectedNotification.createdAt)}
                      </div>
                      {selectedNotification.sentAt && (
                        <div>
                          <span className="font-medium text-gray-700">Delivered:</span> {formatFullDate(selectedNotification.sentAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-6 flex-1 overflow-y-auto">
                    <div className="prose max-w-none">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedNotification.body}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <p>Status: <span className="font-medium capitalize">{selectedNotification.status}</span></p>
                        {selectedNotification.errorMessage && (
                          <p className="mt-1 text-red-600">Error: {selectedNotification.errorMessage}</p>
                        )}
                      </div>
                      {!selectedNotification.isRead && (
                        <button
                          onClick={() => {
                            handleMarkAsRead(selectedNotification.emailId);
                          }}
                          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-sm">Select an email to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

