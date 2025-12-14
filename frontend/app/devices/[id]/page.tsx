'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { deviceService } from '@/lib/api/device-service';
import { Device, DeviceInventory, ApiResponse } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isStaff } = useAuth();
  const deviceId = params.id as string;
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [isRemovingWaitlist, setIsRemovingWaitlist] = useState(false);
  const [myWaitlist, setMyWaitlist] = useState<any[]>([]);
  const [availableCount, setAvailableCount] = useState<number | null>(null);

  useEffect(() => {
    fetchDevice();
  }, [deviceId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyWaitlist();
    }
  }, [deviceId, isAuthenticated]);

  const fetchDevice = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response: ApiResponse<Device> = await deviceService.getDeviceById(deviceId);
      if (response.success && response.data) {
        setDevice(response.data);
        // Fetch available count using inventory endpoint (works for both authenticated and unauthenticated)
        try {
          const inventoryResponse: ApiResponse<DeviceInventory[]> = await deviceService.getInventoryByDeviceId(deviceId);
          if (inventoryResponse.success && inventoryResponse.data) {
            // Count how many inventory items are available
            const availableCount = inventoryResponse.data.filter((item: DeviceInventory) => item.isAvailable).length;
            setAvailableCount(availableCount);
          } else {
            setAvailableCount(0);
          }
        } catch (err) {
          console.error('Error fetching inventory:', err);
          setAvailableCount(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load device');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyWaitlist = async () => {
    if (!isAuthenticated) return;
    try {
      const response: ApiResponse<any[]> = await deviceService.getMyWaitlist();
      if (response.success && response.data) {
        setMyWaitlist(response.data);
      }
    } catch (err) {
      // Ignore error
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsReserving(true);
    setError('');
    try {
      const response = await deviceService.reserveDevice(deviceId);
      if (response.success) {
        alert('Device reserved successfully!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reserve device');
    } finally {
      setIsReserving(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsJoiningWaitlist(true);
    setError('');
    try {
      const response = await deviceService.joinWaitlist(deviceId);
      if (response.success) {
        alert('Added to waitlist successfully!');
        fetchMyWaitlist();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const handleRemoveWaitlist = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsRemovingWaitlist(true);
    setError('');
    try {
      const response = await deviceService.removeFromWaitlist(deviceId);
      if (response.success) {
        alert('Removed from waitlist successfully!');
        fetchMyWaitlist();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove from waitlist');
    } finally {
      setIsRemovingWaitlist(false);
    }
  };

  const isOnWaitlist = myWaitlist.some((w) => w.deviceId === deviceId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Device not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-primary-600 hover:text-primary-700 text-sm"
        >
          ← Back to Devices
        </button>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 mb-2">
                {device.brand} {device.model}
              </h1>
              <p className="text-sm text-gray-600">{device.category}</p>
            </div>
            {availableCount !== null && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                availableCount > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {availableCount > 0
                  ? `${availableCount} available`
                  : 'Out of stock'}
              </span>
            )}
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-sm text-gray-700">{device.description}</p>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Specifications</h2>
            <p className="text-sm text-gray-700">{device.specifications}</p>
          </div>

          {!isAuthenticated && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-xs">
                Please <Link href="/login" className="font-medium underline">login</Link> to reserve devices or join the waitlist.
              </p>
            </div>
          )}

          {isStaff && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-xs">
                Staff members cannot reserve devices or join waitlists.
              </p>
            </div>
          )}

          {!isStaff && (
            <div className="flex justify-end mt-6">
              {availableCount !== null && availableCount > 0 ? (
                <button
                  onClick={handleReserve}
                  disabled={isReserving || !isAuthenticated}
                  className="bg-primary-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isReserving ? 'Reserving...' : isAuthenticated ? 'Reserve Device' : 'Login to Reserve'}
                </button>
              ) : (
                <>
                  {isAuthenticated && isOnWaitlist ? (
                    <button
                      onClick={handleRemoveWaitlist}
                      disabled={isRemovingWaitlist}
                      className="bg-red-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isRemovingWaitlist ? 'Removing...' : 'Remove from Waitlist'}
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinWaitlist}
                      disabled={isJoiningWaitlist || !isAuthenticated}
                      className="bg-yellow-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isJoiningWaitlist ? 'Joining...' : isAuthenticated ? 'Join Waitlist' : 'Login to Join Waitlist'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
    </div>
  );
}


