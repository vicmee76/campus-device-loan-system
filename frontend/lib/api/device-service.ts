import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const DEVICE_SERVICE_URL = process.env.NEXT_PUBLIC_DEVICE_SERVICE_URL || 'http://localhost:7778';

class DeviceServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${DEVICE_SERVICE_URL}/v1/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // User endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/users/login', { email, password });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async getAllUsers(params?: {
    page?: number;
    pageSize?: number;
    role?: string;
    isActive?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    const response = await this.client.get('/users/get-all-users', { params });
    return response.data;
  }

  async getUserById(id: string) {
    const response = await this.client.get(`/users/get-user-by-id/${id}`);
    return response.data;
  }

  // Device endpoints
  async getAllDevices(params?: { page?: number; pageSize?: number; search?: string }) {
    const response = await this.client.get('/devices/get-all-devices', { params });
    return response.data;
  }

  async getDeviceById(id: string) {
    const response = await this.client.get(`/devices/get-device-by-id/${id}`);
    return response.data;
  }

  async getAvailableDevices(params?: { page?: number; pageSize?: number; search?: string }) {
    const response = await this.client.get('/devices/available-devices', { params });
    return response.data;
  }

  async getInventoryByDeviceId(deviceId: string) {
    const response = await this.client.get(`/device-inventory/get-by-device-id/${deviceId}`);
    return response.data;
  }

  async getAllInventory(params?: { page?: number; pageSize?: number }) {
    const response = await this.client.get('/device-inventory/get-all', { params });
    return response.data;
  }

  // Reservation endpoints
  async reserveDevice(deviceId: string) {
    const response = await this.client.post(`/reservations/${deviceId}/reserve`);
    return response.data;
  }

  async cancelReservation(reservationId: string) {
    const response = await this.client.patch(`/reservations/${reservationId}/cancel`);
    return response.data;
  }

  async getMyReservations(params?: { page?: number; pageSize?: number }) {
    const response = await this.client.get('/reservations/me', { params });
    return response.data;
  }

  async getAllReservations(params?: { page?: number; pageSize?: number }) {
    const response = await this.client.get('/reservations/get-all', { params });
    return response.data;
  }

  async getReservationsByUserId(userId: string) {
    const response = await this.client.get(`/reservations/get-by-user-id/${userId}`);
    return response.data;
  }

  // Waitlist endpoints
  async joinWaitlist(deviceId: string) {
    const response = await this.client.post(`/waitlist/${deviceId}/join`);
    return response.data;
  }

  async removeFromWaitlist(deviceId: string) {
    const response = await this.client.delete(`/waitlist/${deviceId}/remove`);
    return response.data;
  }

  async getMyWaitlist() {
    const response = await this.client.get('/waitlist/my-waitlist');
    return response.data;
  }

  async getAllWaitlist(params?: { page?: number; pageSize?: number }) {
    const response = await this.client.get('/waitlist/get-all', { params });
    return response.data;
  }

  async getWaitlistByUserId(userId: string) {
    const response = await this.client.get(`/waitlist/get-by-user-id/${userId}`);
    return response.data;
  }

  // Email notification endpoints
  async getEmailsByUserId(userId: string, params?: { isRead?: boolean; limit?: number }) {
    const response = await this.client.get(`/users/emails/user/${userId}`, { params });
    return response.data;
  }

  async getEmailById(emailId: string) {
    const response = await this.client.get(`/users/emails/${emailId}`);
    return response.data;
  }

  async markEmailAsRead(emailId: string) {
    const response = await this.client.patch(`/users/emails/${emailId}/mark-read`);
    return response.data;
  }
}

export const deviceService = new DeviceServiceClient();


