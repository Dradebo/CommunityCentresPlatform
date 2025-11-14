import { API_BASE_URL } from '../utils/env';

// API service for connecting to the backend

class APIService {
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication methods
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: 'VISITOR' | 'CENTER_MANAGER' | 'ENTREPRENEUR';
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    const result = await this.handleResponse<{
      message: string;
      token: string;
      user: any;
    }>(response);
    
    if (result.token) {
      localStorage.setItem('auth_token', result.token);
    }
    
    return result;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials),
    });

    const result = await this.handleResponse<{
      message: string;
      token: string;
      user: any;
    }>(response);

    if (result.token) {
      localStorage.setItem('auth_token', result.token);
    }

    return result;
  }

  async loginWithGoogle(credential: string) {
    const response = await fetch(`${API_BASE_URL}/auth/google/verify`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ credential }),
    });

    const result = await this.handleResponse<{
      message: string;
      token: string;
      user: any;
    }>(response);

    if (result.token) {
      localStorage.setItem('auth_token', result.token);
    }

    return result;
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ user: any }>(response);
  }

  logout() {
    try {
      localStorage.removeItem('auth_token');
    } catch {
      // Ignore localStorage errors in SSR or other environments
    }
  }

  // Centers methods
  async getCenters(filters?: {
    searchQuery?: string;
    services?: string[];
    locations?: string[];
    verificationStatus?: string;
    connectionStatus?: string;
    addedBy?: string;
  }) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/centers/?${params}`, {
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ centers: any[] }>(response);
  }

  async getCenter(id: string) {
    const response = await fetch(`${API_BASE_URL}/centers/${id}`, {
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ center: any }>(response);
  }

  async createCenter(centerData: {
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    services: string[];
    description: string;
    phone?: string;
    email?: string;
    website?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/centers`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(centerData),
    });
    
    return this.handleResponse<{ message: string; center: any }>(response);
  }

  async verifyCenter(centerId: string) {
    const response = await fetch(`${API_BASE_URL}/centers/${centerId}/verify`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ message: string; center: any }>(response);
  }

  async connectCenters(center1Id: string, center2Id: string) {
    const response = await fetch(`${API_BASE_URL}/centers/connect`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ center1Id, center2Id }),
    });
    
    return this.handleResponse<{ message: string; connection: any }>(response);
  }

  // Messages methods
  async getContactMessages() {
    const response = await fetch(`${API_BASE_URL}/messages/contact`, {
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ messages: any[] }>(response);
  }

  async sendContactMessage(messageData: {
    centerId: string;
    subject: string;
    message: string;
    inquiryType: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/messages/contact`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    
    return this.handleResponse<{ message: string; contactMessage: any }>(response);
  }

  async getMessageThreads(centerId: string) {
    const response = await fetch(`${API_BASE_URL}/messages/threads/${centerId}`, {
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ threads: any[] }>(response);
  }

  async getThreadMessages(threadId: string) {
    const response = await fetch(`${API_BASE_URL}/messages/threads/${threadId}/messages`, {
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ messages: any[] }>(response);
  }

  async sendThreadMessage(threadId: string, content: string) {
    const response = await fetch(`${API_BASE_URL}/messages/threads/${threadId}/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    
    return this.handleResponse<{ message: string; centerMessage: any }>(response);
  }

  async createMessageThread(threadData: {
    participantIds: string[];
    subject: string;
    initialMessage: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/messages/threads`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(threadData),
    });
    
    return this.handleResponse<{ message: string; thread: any }>(response);
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Role upgrade request methods
  async createRoleUpgradeRequest(data: {
    requestedRole: string;
    centerId?: string;
    justification: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/role-upgrades`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async getMyUpgradeRequest() {
    const response = await fetch(`${API_BASE_URL}/role-upgrades/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async getRoleUpgradeRequests(status?: string) {
    const url = status
      ? `${API_BASE_URL}/role-upgrades?status=${status}`
      : `${API_BASE_URL}/role-upgrades`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async reviewRoleUpgradeRequest(requestId: string, data: {
    action: 'approve' | 'reject';
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/role-upgrades/${requestId}/review`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }
}

export const apiService = new APIService();