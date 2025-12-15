'use client';

import { useState, useEffect } from 'react';
import { deviceService } from '@/lib/api/device-service';
import { Waitlist, ApiResponse, PaginatedResponse } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { format } from 'date-fns';

export default function AllWaitlistPage() {
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWaitlist();
  }, [page]);

  const fetchWaitlist = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response: ApiResponse<PaginatedResponse<Waitlist>> = await deviceService.getAllWaitlist({
        page,
        pageSize: 20,
      });
      if (response.success && response.data) {
        setWaitlist(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load waitlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requireStaff>
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">All Waitlist</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : waitlist.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No waitlist entries found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {waitlist.map((item) => (
                <div key={item.waitlistId} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {item.device && (
                          <div>
                            <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">{item.device.brand}</p>
                            <h3 className="text-lg font-semibold text-gray-900 mt-1">
                              {item.device.model}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{item.device.category}</p>
                          </div>
                        )}
                        <div>
                          {item.position && (
                            <>
                              <p className="text-xs text-gray-500 mb-1">Position</p>
                              <p className="text-sm font-medium text-gray-900 mb-2">#{item.position}</p>
                            </>
                          )}
                          <p className="text-xs text-gray-500 mb-1">Joined</p>
                          <p className="text-sm text-gray-700">{format(new Date(item.joinedAt || (item as any).addedAt || new Date()), 'PPp')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

