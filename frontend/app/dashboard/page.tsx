'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deviceService } from '@/lib/api/device-service';
import { Reservation, Waitlist, ApiResponse, PaginatedResponse } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user, isStaff } = useAuth();
  const router = useRouter();

  // Redirect staff to admin dashboard
  useEffect(() => {
    if (isStaff) {
      router.push('/staff');
    }
  }, [isStaff, router]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reservations' | 'waitlist'>('reservations');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch reservations
      const reservationsResponse: ApiResponse<PaginatedResponse<Reservation>> =
        await deviceService.getMyReservations({ page: 1, pageSize: 100 });
      if (reservationsResponse.success && reservationsResponse.data) {
        setReservations(reservationsResponse.data.data);
      }

      // Fetch waitlist using my-waitlist endpoint
      try {
        const waitlistResponse: ApiResponse<Waitlist[]> = await deviceService.getMyWaitlist();
        if (waitlistResponse.success && waitlistResponse.data) {
          setWaitlist(waitlistResponse.data);
        } else {
          setWaitlist([]);
        }
      } catch (err) {
        console.error('Failed to fetch waitlist:', err);
        setWaitlist([]);
      }

    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      const response = await deviceService.cancelReservation(reservationId);
      if (response.success) {
        alert('Reservation cancelled successfully');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const handleRemoveWaitlist = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this from your waitlist?')) return;

    try {
      const response = await deviceService.removeFromWaitlist(deviceId);
      if (response.success) {
        alert('Removed from waitlist successfully');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove from waitlist');
    }
  };

  if (isLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Dashboard</h1>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reservations'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reservations ({reservations.filter(reservation => reservation.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'waitlist'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Waitlist ({waitlist.length})
            </button>
          </nav>
        </div>

        {activeTab === 'reservations' && (
          <div>
            {reservations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No reservations found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {reservations.map((reservation) => (
                  <div 
                    key={reservation.reservationId} 
                    className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedReservation(reservation)}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {reservation.device && (
                            <div>
                              <p className="text-[10px] font-medium text-primary-600 uppercase tracking-wide">{reservation.device.brand}</p>
                              <h3 className="text-xs font-semibold text-gray-900 mt-1">
                                {reservation.device.model}
                              </h3>
                              <p className="text-[10px] text-gray-500 mt-1">{reservation.device.category}</p>
                            </div>
                          )}
                          {reservation.inventory && (
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Serial Number</p>
                              <p className="text-[10px] font-medium text-gray-900 mb-2">{reservation.inventory.serialNumber}</p>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                reservation.inventory.isAvailable
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {reservation.inventory.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Reserved</p>
                              <p className="text-[10px] text-gray-700">{reservation.reservedAt ? format(new Date(reservation.reservedAt), 'PPp') : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Status</p>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                                reservation.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : reservation.status === 'collected'
                                  ? 'bg-blue-100 text-blue-800'
                                  : reservation.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : reservation.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : reservation.status === 'returned'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {reservation.status}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1">Due Date</p>
                            <p className="text-[10px] text-gray-700">{reservation.dueDate ? format(new Date(reservation.dueDate), 'PPp') : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      {reservation.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelReservation(reservation.reservationId);
                          }}
                          className="mt-6 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-[10px] w-full font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'waitlist' && (
          <div>
            {waitlist.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No waitlist entries found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {waitlist.map((item) => (
                  <div key={item.waitlistId} className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {item.device && (
                            <div>
                              <p className="text-[10px] font-medium text-primary-600 uppercase tracking-wide">{item.device.brand}</p>
                              <h3 className="text-xs font-semibold text-gray-900 mt-1">
                                {item.device.model}
                              </h3>
                              <p className="text-[10px] text-gray-500 mt-1">{item.device.category}</p>
                            </div>
                          )}
                          <div>
                            {item.position && (
                              <>
                                <p className="text-[10px] text-gray-500 mb-1">Position</p>
                                <p className="text-[10px] font-medium text-gray-900 mb-2">#{item.position}</p>
                              </>
                            )}
                            <p className="text-[10px] text-gray-500 mb-1">Joined</p>
                            <p className="text-[10px] text-gray-700">{format(new Date(item.joinedAt || (item as any).addedAt || new Date()), 'PPp')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => handleRemoveWaitlist(item.deviceId)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-[10px] font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reservation Detail Modal */}
        {selectedReservation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReservation(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Reservation Details</h2>
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Device & Inventory Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {selectedReservation.device && (
                      <div>
                        <div>
                          <p className="text-[10px] text-gray-500">Brand</p>
                          <p className="text-sm font-semibold text-primary-600">{selectedReservation.device.brand}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-[10px] text-gray-500">Model</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedReservation.device.model}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-[10px] text-gray-500">Category</p>
                          <p className="text-xs text-gray-700">{selectedReservation.device.category}</p>
                        </div>
                        {selectedReservation.device.description && (
                          <div className="mt-2">
                            <p className="text-[10px] text-gray-500">Description</p>
                            <p className="text-xs text-gray-700">{selectedReservation.device.description}</p>
                          </div>
                        )}
                        {selectedReservation.device.specifications && (
                          <div className="mt-2">
                            <p className="text-[10px] text-gray-500">Specifications</p>
                            <p className="text-xs text-gray-700">{selectedReservation.device.specifications}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedReservation.inventory && (
                      <div>
                        <div>
                          <p className="text-[10px] text-gray-500">Serial Number</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedReservation.inventory.serialNumber}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-[10px] text-gray-500">Availability</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                            selectedReservation.inventory.isAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedReservation.inventory.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Reservation Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div>
                        <p className="text-[10px] text-gray-500">Reserved At</p>
                        <p className="text-xs text-gray-700">{selectedReservation.reservedAt ? format(new Date(selectedReservation.reservedAt), 'PPpp') : 'N/A'}</p>
                      </div>
                      <div className="mt-2">
                        <p className="text-[10px] text-gray-500">Due Date</p>
                        <p className="text-xs text-gray-700">{selectedReservation.dueDate ? format(new Date(selectedReservation.dueDate), 'PPpp') : 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-2">Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        selectedReservation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedReservation.status === 'collected'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedReservation.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : selectedReservation.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : selectedReservation.status === 'returned'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedReservation.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedReservation.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        handleCancelReservation(selectedReservation.reservationId);
                        setSelectedReservation(null);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}


