import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const LOAN_SERVICE_URL = process.env.NEXT_PUBLIC_LOAN_SERVICE_URL || 'http://localhost:7779';

class LoanServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${LOAN_SERVICE_URL}/v1/api`,
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

  // Loan endpoints
  async collectLoan(reservationId: string) {
    const response = await this.client.patch(`/loans/${reservationId}/collect`);
    return response.data;
  }

  async returnLoan(loanId: string) {
    const response = await this.client.patch(`/loans/${loanId}/return`);
    return response.data;
  }

  async getAllLoans(params?: { page?: number; pageSize?: number }) {
    const response = await this.client.get('/loans/get-all-loans', { params });
    return response.data;
  }

  async getLoansByUserId(userId: string, params?: { page?: number; pageSize?: number }) {
    const response = await this.client.get(`/loans/user/${userId}`, { params });
    return response.data;
  }
}

export const loanService = new LoanServiceClient();


