'use client';

import { useState, useEffect } from 'react';
import { deviceService } from '@/lib/api/device-service';
import { DeviceInventory, ApiResponse, PaginatedResponse } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { format } from 'date-fns';

export default function AllInventoryPage() {
  const [inventory, setInventory] = useState<DeviceInventory[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInventory();
  }, [page]);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response: ApiResponse<PaginatedResponse<DeviceInventory>> = await deviceService.getAllInventory({
        page,
        pageSize: 20,
      });
      if (response.success && response.data) {
        setInventory(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requireStaff>
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">All Inventory</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No inventory items found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {inventory.map((item) => (
                <div key={item.inventoryId} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Serial Number</p>
                        <p className="text-lg font-semibold text-gray-900">{item.serialNumber}</p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Device ID</p>
                            <p className="text-sm text-gray-700 font-mono text-xs">{item.deviceId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Status</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                              item.isAvailable
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Created</p>
                          <p className="text-sm text-gray-700">{format(new Date(item.createdAt), 'PPp')}</p>
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

