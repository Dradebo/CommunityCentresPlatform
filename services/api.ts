import { API_BASE_URL } from '../utils/env';

// Static mode: use local JSON when backend is unavailable
const STATIC_CENTERS_URL = '/centers.json';

// API service - now works in static mode with local JSON fallback
let staticCentersCache: any[] | null = null;

class APIService {
  private useStaticMode = false;

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

  // Load centers from static JSON file
  private async loadStaticCenters(): Promise<any[]> {
    if (staticCentersCache) return staticCentersCache;
    
    try {
      const response = await fetch(STATIC_CENTERS_URL);
      if (!response.ok) throw new Error('Failed to load static centers');
      const data = await response.json();
      staticCentersCache = data;
      return data;
    } catch (error) {
      console.error('Error loading static centers:', error);
      return [];
    }
  }

  // Filter static centers based on criteria
  private filterCenters(centers: any[], filters?: {
    searchQuery?: string;
    services?: string[];
    locations?: string[];
    verificationStatus?: string;
    connectionStatus?: string;
    addedBy?: string;
  }): any[] {
    if (!filters) return centers;
    
    return centers.filter(center => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchText = `${center.name} ${center.location} ${center.description} ${center.services?.join(' ')}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }
      
      if (filters.services && filters.services.length > 0) {
        if (!filters.services.some((s: string) => center.services?.includes(s))) return false;
      }
      
      if (filters.locations && filters.locations.length > 0) {
        if (!filters.locations.some((l: string) => center.location?.includes(l))) return false;
      }
      
      if (filters.verificationStatus !== undefined) {
        const isVerified = filters.verificationStatus === 'true';
        if (center.verified !== isVerified) return false;
      }
      
      if (filters.addedBy) {
        if (center.addedBy !== filters.addedBy) return false;
      }
      
      return true;
    });
  }

  // Authentication methods (disabled in static mode)
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: 'VISITOR' | 'CENTER_MANAGER' | 'ENTREPRENEUR';
  }) {
    console.warn('Auth disabled in static mode');
    return { message: 'Auth disabled', token: '', user: null };
  }

  async login(credentials: { email: string; password: string }) {
    console.warn('Auth disabled in static mode');
    return { message: 'Auth disabled', token: '', user: null };
  }

  async loginWithGoogle(credential: string) {
    console.warn('Auth disabled in static mode');
    return { message: 'Auth disabled', token: '', user: null };
  }

  async getCurrentUser() {
    return { user: null };
  }

  logout() {
    try {
      localStorage.removeItem('auth_token');
    } catch {
      // Ignore localStorage errors
    }
  }

  // Centers methods - now uses static JSON
  async getCenters(filters?: {
    searchQuery?: string;
    services?: string[];
    locations?: string[];
    verificationStatus?: string;
    connectionStatus?: string;
    addedBy?: string;
  }) {
    // Use static JSON directly - no backend needed
    const centers = await this.loadStaticCenters();
    const filtered = this.filterCenters(centers, filters);
    return { centers: filtered };
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