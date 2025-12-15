'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { deviceService } from '@/lib/api/device-service';
import { Device, ApiResponse, PaginatedResponse } from '@/lib/types';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDevices();
  }, [page]);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response: ApiResponse<PaginatedResponse<Device>> = await deviceService.getAllDevices({
        page,
        pageSize: 12,
        search: search || undefined,
      });
      if (response.success && response.data) {
        setDevices(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDevices();
  };

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Device Catalog</h1>
          <p className="mt-2 text-gray-600">Browse and reserve available devices</p>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search devices by brand, model, or category..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Search
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No devices found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {devices.map((device) => (
                <Link
                  key={device.deviceId}
                  href={`/devices/${device.deviceId}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 select-text"
                  onClick={(e) => {
                    // Prevent navigation if user is selecting text
                    if (window.getSelection()?.toString().length) {
                      e.preventDefault();
                    }
                  }}
                >
                  <p className="text-sm font-medium text-primary-600 mb-1">{device.brand}</p>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {device.model}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{device.category}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{device.description}</p>
                  {device.availableCount !== undefined && (
                    <div className="mt-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.availableCount > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {device.availableCount > 0
                          ? `${device.availableCount} available`
                          : 'Out of stock'}
                      </span>
                    </div>
                  )}
                </Link>
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
  );
}


