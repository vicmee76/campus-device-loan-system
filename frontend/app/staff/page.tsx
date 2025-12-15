'use client';

import { useState, useEffect } from 'react';
import { loanService } from '@/lib/api/loan-service';
import { deviceService } from '@/lib/api/device-service';
import { Loan, Reservation, ApiResponse, PaginatedResponse, User, Waitlist, DeviceInventory, Pagination, Device } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { format } from 'date-fns';

export default function StaffDashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [inventory, setInventory] = useState<DeviceInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'loans' | 'reservations' | 'users' | 'waitlist' | 'inventory'>('loans');
  const [page, setPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersSearchInput, setUsersSearchInput] = useState('');
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [openUserDropdown, setOpenUserDropdown] = useState<string | null>(null);
  const [selectedUserReservations, setSelectedUserReservations] = useState<Reservation[]>([]);
  const [selectedUserWaitlist, setSelectedUserWaitlist] = useState<Waitlist[]>([]);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [showUserReservationsModal, setShowUserReservationsModal] = useState(false);
  const [showUserWaitlistModal, setShowUserWaitlistModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDeviceDetailsModal, setShowDeviceDetailsModal] = useState(false);

  // Fetch both loans and reservations on initial load to show counts
  useEffect(() => {
    if (!hasInitialLoad) {
      fetchInitialData();
    }
  }, [hasInitialLoad]);

  // Fetch data when tab or page changes (after initial load)
  useEffect(() => {
    if (hasInitialLoad) {
      fetchData();
    }
  }, [page, activeTab, hasInitialLoad, usersPage, usersSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openUserDropdown && !(event.target as Element).closest('.user-dropdown-container')) {
        setOpenUserDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openUserDropdown]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch both loans and reservations on initial load
      const [loansResponse, reservationsResponse] = await Promise.all([
        loanService.getAllLoans({ page: 1, pageSize: 20 }),
        deviceService.getAllReservations({ page: 1, pageSize: 20 }),
      ]);
      
      if (loansResponse.success && loansResponse.data) {
        setLoans(loansResponse.data.data);
      }
      if (reservationsResponse.success && reservationsResponse.data) {
        setReservations(reservationsResponse.data.data);
      }
      setHasInitialLoad(true);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setHasInitialLoad(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'loans') {
        const response: ApiResponse<PaginatedResponse<Loan>> = await loanService.getAllLoans({
          page,
          pageSize: 20,
        });
        if (response.success && response.data) {
          setLoans(response.data.data);
        }
      } else if (activeTab === 'reservations') {
        const response: ApiResponse<PaginatedResponse<Reservation>> =
          await deviceService.getAllReservations({
            page,
            pageSize: 20,
          });
        if (response.success && response.data) {
          setReservations(response.data.data);
        }
      } else if (activeTab === 'users') {
        const params: any = {
          page: usersPage,
          pageSize: 20,
        };
        // Add search parameters if search term exists
        if (usersSearch) {
          // Try to match email, firstName, or lastName
          params.email = usersSearch;
          params.firstName = usersSearch;
          params.lastName = usersSearch;
        }
        const response: ApiResponse<PaginatedResponse<User>> = await deviceService.getAllUsers(params);
        if (response.success && response.data) {
          setUsers(response.data.data);
          setUsersPagination(response.data.pagination);
        }
      } else if (activeTab === 'waitlist') {
        const response: ApiResponse<PaginatedResponse<Waitlist>> = await deviceService.getAllWaitlist({
          page,
          pageSize: 20,
        });
        if (response.success && response.data) {
          setWaitlist(response.data.data);
        }
      } else if (activeTab === 'inventory') {
        const response: ApiResponse<PaginatedResponse<DeviceInventory>> = await deviceService.getAllInventory({
          page,
          pageSize: 20,
        });
        if (response.success && response.data) {
          setInventory(response.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollectLoan = async (reservationId: string) => {
    if (!confirm('Mark this reservation as collected?')) return;

    try {
      const response = await loanService.collectLoan(reservationId);
      if (response.success) {
        alert('Loan collected successfully');
        fetchData();
        // Refresh counts to update the loans count in the tab
        if (hasInitialLoad) {
          fetchInitialData();
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to collect loan');
    }
  };

  const handleReturnLoan = async (loanId: string) => {
    if (!confirm('Mark this loan as returned?')) return;

    try {
      const response = await loanService.returnLoan(loanId);
      if (response.success) {
        alert('Loan returned successfully');
        fetchData();
        if (hasInitialLoad) {
          fetchInitialData(); // Refresh counts
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to return loan');
    }
  };

  const handleViewUserReservations = async (user: User) => {
    try {
      const response: ApiResponse<Reservation[]> = await deviceService.getReservationsByUserId(user.userId);
      if (response.success && response.data) {
        setSelectedUserReservations(response.data);
        setSelectedUserForDetails(user);
        setShowUserReservationsModal(true);
        setOpenUserDropdown(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to fetch user reservations');
    }
  };

  const handleViewUserWaitlist = async (user: User) => {
    try {
      const response: ApiResponse<Waitlist[]> = await deviceService.getWaitlistByUserId(user.userId);
      if (response.success && response.data) {
        setSelectedUserWaitlist(response.data);
        setSelectedUserForDetails(user);
        setShowUserWaitlistModal(true);
        setOpenUserDropdown(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to fetch user waitlist');
    }
  };

  const handleViewDeviceDetails = async (deviceId: string) => {
    try {
      const response: ApiResponse<Device> = await deviceService.getDeviceById(deviceId);
      if (response.success && response.data) {
        setSelectedDevice(response.data);
        setShowDeviceDetailsModal(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to fetch device details');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireStaff>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireStaff>
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Staff Dashboard</h1>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('loans');
                setPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'loans'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Loans ({loans.filter(loan => !loan.returnedAt).length})
            </button>
            <button
              onClick={() => {
                setActiveTab('reservations');
                setPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'reservations'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reservations ({reservations.filter(reservation => reservation.status === 'pending').length})
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                setPage(1);
                setUsersPage(1);
                setUsersSearch('');
                setUsersSearchInput('');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => {
                setActiveTab('waitlist');
                setPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'waitlist'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Waitlist
            </button>
            <button
              onClick={() => {
                setActiveTab('inventory');
                setPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inventory
            </button>
          </nav>
        </div>

        {activeTab === 'loans' && (
          <div>
            {loans.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No loans found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {loans.map((loan) => (
                  <div key={loan.loanId} className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="grid grid-cols-2 gap-4">
                              {loan.device && (
                                <div>
                                  <p className="text-[10px] font-medium text-primary-600 uppercase tracking-wide">{loan.device.brand}</p>
                                  <h3 className="text-xs font-semibold text-gray-900 mt-1">
                                    {loan.device.model}
                                  </h3>
                                  <p className="text-[10px] text-gray-500 mt-1">{loan.device.category}</p>
                                </div>
                              )}
                              {loan.inventory && (
                                <div>
                                  <p className="text-[10px] text-gray-500 mb-1">Serial Number</p>
                                  <p className="text-[10px] font-medium text-gray-900 mb-2">{loan.inventory.serialNumber}</p>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                    loan.inventory.isAvailable
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {loan.inventory.isAvailable ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedLoan(loan)}
                            className="ml-2 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
                            title="View full details"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">User</p>
                              <p className="text-[10px] text-gray-700">{loan.user?.firstName} {loan.user?.lastName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Status</p>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                                !loan.returnedAt
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {!loan.returnedAt ? 'Active' : 'Returned'}
                              </span>
                              {loan.returnedAt && (
                                <>
                                  <p className="text-[10px] text-gray-500 mb-1 mt-2">Returned</p>
                                  <p className="text-[10px] text-gray-700">{format(new Date(loan.returnedAt), 'PPp')}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Collected</p>
                              <p className="text-[10px] text-gray-700">{loan.collectedAt ? format(new Date(loan.collectedAt), 'PPp') : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Due Date</p>
                              <p className="text-[10px] text-gray-700">{loan.reservation?.dueDate ? format(new Date(loan.reservation.dueDate), 'PPp') : 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {!loan.returnedAt && (
                        <button
                          onClick={() => handleReturnLoan(loan.loanId)}
                          className="mt-6 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-[10px] w-full font-medium"
                        >
                          Mark Returned
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div>
            {reservations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No reservations found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {reservations.map((reservation) => (
                  <div key={reservation.reservationId} className="bg-white rounded-lg shadow p-6">
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
                              <p className="text-[10px] text-gray-500 mb-1">User</p>
                              <p className="text-[10px] text-gray-700">{reservation.user?.firstName} {reservation.user?.lastName}</p>
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
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Reserved</p>
                              <p className="text-[10px] text-gray-700">{reservation.reservedAt ? format(new Date(reservation.reservedAt), 'PPp') : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Due Date</p>
                              <p className="text-[10px] text-gray-700">{reservation.dueDate ? format(new Date(reservation.dueDate), 'PPp') : 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {reservation.status === 'pending' && (
                        <button
                          onClick={() => handleCollectLoan(reservation.reservationId)}
                          className="mt-6 px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-[10px] w-full font-medium"
                        >
                          Mark Collected
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                All Users {usersPagination ? `(${usersPagination.totalCount})` : ''}
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={usersSearchInput}
                  onChange={(e) => setUsersSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setUsersSearch(usersSearchInput);
                      setUsersPage(1);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    setUsersSearch(usersSearchInput);
                    setUsersPage(1);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                >
                  Search
                </button>
                {usersSearch && (
                  <button
                    onClick={() => {
                      setUsersSearch('');
                      setUsersSearchInput('');
                      setUsersPage(1);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {users.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {users.map((user) => (
                    <div key={user.userId} className="bg-white rounded-lg shadow p-6 relative">
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                           <div className="mb-4 flex justify-between items-start">
                             <div>
                               <h3 className="text-sm font-semibold text-gray-900">
                                 {user.firstName} {user.lastName}
                               </h3>
                               <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                             </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-900 text-white">
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <div className="pt-4 border-t border-gray-200">
                            <div className={`flex ${user.role !== 'staff' ? 'justify-between' : ''} items-center`}>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Created</p>
                                <p className="text-xs text-gray-700">{format(new Date(user.createdAt), 'PPp')}</p>
                              </div>
                              {user.role !== 'staff' && (
                                <div className="relative user-dropdown-container">
                                  <button
                                    onClick={() => setOpenUserDropdown(openUserDropdown === user.userId ? null : user.userId)}
                                    className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                  >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {openUserDropdown === user.userId && (
                                    <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                      <div className="py-1">
                                        <button
                                          onClick={() => handleViewUserReservations(user)}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          View Reservations
                                        </button>
                                        <button
                                          onClick={() => handleViewUserWaitlist(user)}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          View Waitlist
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {usersPagination && usersPagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setUsersPage(usersPage - 1)}
                      disabled={!usersPagination.hasPreviousPage}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {usersPagination.page} of {usersPagination.totalPages}
                    </span>
                    <button
                      onClick={() => setUsersPage(usersPage + 1)}
                      disabled={!usersPagination.hasNextPage}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'waitlist' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">All Waitlist Entries ({waitlist.length})</h2>
            </div>
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
                        {item.user && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-1">User</p>
                            <p className="text-sm font-medium text-gray-900 mb-2">{item.user.firstName} {item.user.lastName}</p>
                            <p className="text-xs text-gray-500 mb-1">Email</p>
                            <p className="text-xs text-gray-700">{item.user.email}</p>
                          </div>
                        )}
                        <div className="pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-4">
                            {item.device && (
                              <div>
                                <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">{item.device.brand}</p>
                                <h3 className="text-sm font-semibold text-gray-900 mt-1">
                                  {item.device.model}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">{item.device.category}</p>
                                {item.position && (
                                  <>
                                    <p className="text-xs text-gray-500 mb-1 mt-2">Position</p>
                                    <p className="text-xs font-medium text-gray-900">#{item.position}</p>
                                  </>
                                )}
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Joined</p>
                              <p className="text-xs text-gray-700">{format(new Date(item.joinedAt || item.addedAt || new Date()), 'PPp')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">All Inventory Items ({inventory.length})</h2>
            </div>
            {inventory.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No inventory items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {inventory.map((item) => (
                  <div key={item.inventoryId} className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="mb-4 flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-500 mb-1">Serial Number</p>
                            <h3 className="text-xs font-semibold text-gray-900">
                              {item.serialNumber}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              item.isAvailable
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                            <button
                              onClick={() => handleViewDeviceDetails(item.deviceId)}
                              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Device ID</p>
                              <p className="text-[10px] text-gray-700 font-mono">{item.deviceId}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 mb-1">Created</p>
                              <p className="text-[10px] text-gray-700">{format(new Date(item.createdAt), 'PPp')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Reservations Modal */}
        {showUserReservationsModal && selectedUserForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserReservationsModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Reservations for {selectedUserForDetails.firstName} {selectedUserForDetails.lastName}
                  </h2>
                  <button
                    onClick={() => setShowUserReservationsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {selectedUserReservations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500">No reservations found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUserReservations.map((reservation) => (
                      <div key={reservation.reservationId} className="border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-3">
                          {reservation.device && (
                            <div>
                              <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">{reservation.device.brand}</p>
                              <h3 className="text-sm font-semibold text-gray-900 mt-1">
                                {reservation.device.model}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">{reservation.device.category}</p>
                            </div>
                          )}
                          {reservation.inventory && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Serial Number</p>
                              <p className="text-xs font-medium text-gray-900 mb-2">{reservation.inventory.serialNumber}</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                reservation.inventory.isAvailable
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {reservation.inventory.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Reserved</p>
                              <p className="text-xs text-gray-700">{reservation.reservedAt ? format(new Date(reservation.reservedAt), 'PPp') : 'N/A'}</p>
                              <p className="text-xs text-gray-500 mb-1 mt-2">Due Date</p>
                              <p className="text-xs text-gray-700">{reservation.dueDate ? format(new Date(reservation.dueDate), 'PPp') : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Status</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Waitlist Modal */}
        {showUserWaitlistModal && selectedUserForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserWaitlistModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Waitlist for {selectedUserForDetails.firstName} {selectedUserForDetails.lastName}
                  </h2>
                  <button
                    onClick={() => setShowUserWaitlistModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {selectedUserWaitlist.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500">No waitlist entries found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUserWaitlist.map((item) => (
                      <div key={item.waitlistId} className="border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-3">
                          {item.device && (
                            <div>
                              <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">{item.device.brand}</p>
                              <h3 className="text-sm font-semibold text-gray-900 mt-1">
                                {item.device.model}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">{item.device.category}</p>
                            </div>
                          )}
                          <div>
                            {item.position && (
                              <>
                                <p className="text-xs text-gray-500 mb-1">Position</p>
                                <p className="text-xs font-medium text-gray-900 mb-2">#{item.position}</p>
                              </>
                            )}
                            <p className="text-xs text-gray-500 mb-1">Joined</p>
                            <p className="text-xs text-gray-700">{format(new Date(item.joinedAt || item.addedAt || new Date()), 'PPp')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Device Details Modal */}
        {showDeviceDetailsModal && selectedDevice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeviceDetailsModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Device Details</h2>
                  <button
                    onClick={() => setShowDeviceDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Device Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] text-gray-500">Brand</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedDevice.brand}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Model</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedDevice.model}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Category</p>
                      <p className="text-xs text-gray-700">{selectedDevice.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Device ID</p>
                      <p className="text-[10px] text-gray-700 font-mono">{selectedDevice.deviceId}</p>
                    </div>
                  </div>
                </div>

                {selectedDevice.description && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Description</h3>
                    <p className="text-xs text-gray-700">{selectedDevice.description}</p>
                  </div>
                )}

                {selectedDevice.specifications && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Specifications</h3>
                    <p className="text-xs text-gray-700">{selectedDevice.specifications}</p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Created</p>
                  <p className="text-xs text-gray-700">{format(new Date(selectedDevice.createdAt), 'PPp')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loan Detail Modal */}
        {selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLoan(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Loan Details</h2>
                  <button
                    onClick={() => setSelectedLoan(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Device Information</h3>
                  {selectedLoan.device && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] text-gray-500">Brand</p>
                        <p className="text-xs text-gray-700 font-medium">{selectedLoan.device.brand}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Model</p>
                        <p className="text-xs text-gray-700 font-medium">{selectedLoan.device.model}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Category</p>
                        <p className="text-xs text-gray-700">{selectedLoan.device.category}</p>
                      </div>
                    </div>
                  )}
                  {selectedLoan.inventory && (
                    <div className="mt-4">
                      <p className="text-[10px] text-gray-500">Serial Number</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedLoan.inventory.serialNumber}</p>
                    </div>
                  )}
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">User Information</h3>
                  {selectedLoan.user && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] text-gray-500">Name</p>
                        <p className="text-xs text-gray-700 font-medium">{selectedLoan.user.firstName} {selectedLoan.user.lastName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Email</p>
                        <p className="text-xs text-gray-700">{selectedLoan.user.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Loan Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] text-gray-500">Collected At</p>
                      <p className="text-xs text-gray-700">{selectedLoan.collectedAt ? format(new Date(selectedLoan.collectedAt), 'PPpp') : 'N/A'}</p>
                    </div>
                    {selectedLoan.reservation?.dueDate && (
                      <div>
                        <p className="text-[10px] text-gray-500">Due Date</p>
                        <p className="text-xs text-gray-700">{format(new Date(selectedLoan.reservation.dueDate), 'PPpp')}</p>
                      </div>
                    )}
                    {selectedLoan.returnedAt && (
                      <div>
                        <p className="text-[10px] text-gray-500">Returned At</p>
                        <p className="text-xs text-gray-700">{format(new Date(selectedLoan.returnedAt), 'PPpp')}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-gray-500 mb-2">Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        !selectedLoan.returnedAt
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {!selectedLoan.returnedAt ? 'Active' : 'Returned'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedLoan.reservation && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Reservation Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {selectedLoan.reservation.reservedAt && (
                        <div>
                          <p className="text-[10px] text-gray-500">Reserved At</p>
                          <p className="text-xs text-gray-700">{format(new Date(selectedLoan.reservation.reservedAt), 'PPpp')}</p>
                        </div>
                      )}
                      {selectedLoan.reservation.status && (
                        <div>
                          <p className="text-[10px] text-gray-500 mb-2">Reservation Status</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            selectedLoan.reservation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedLoan.reservation.status === 'collected'
                              ? 'bg-blue-100 text-blue-800'
                              : selectedLoan.reservation.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : selectedLoan.reservation.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : selectedLoan.reservation.status === 'returned'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedLoan.reservation.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!selectedLoan.returnedAt && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        handleReturnLoan(selectedLoan.loanId);
                        setSelectedLoan(null);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-medium"
                    >
                      Mark Returned
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


