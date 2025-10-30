import { API_BASE_URL } from '../utils/env';
import type {
  Entrepreneur,
  CreateEntrepreneurRequest,
  UpdateEntrepreneurRequest,
  EntrepreneurFilters,
} from '../src/types/entrepreneur';

class EntrepreneurService {
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

  // Create entrepreneur profile (ENTREPRENEUR role required)
  async createEntrepreneurProfile(data: CreateEntrepreneurRequest) {
    const response = await fetch(`${API_BASE_URL}/entrepreneurs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{
      message: string;
      entrepreneur: Entrepreneur;
    }>(response);
  }

  // Get entrepreneur by ID
  async getEntrepreneur(id: string) {
    const response = await fetch(`${API_BASE_URL}/entrepreneurs/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      entrepreneur: Entrepreneur;
    }>(response);
  }

  // Update entrepreneur profile (owner or ADMIN)
  async updateEntrepreneur(id: string, data: UpdateEntrepreneurRequest) {
    const response = await fetch(`${API_BASE_URL}/entrepreneurs/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{
      message: string;
      entrepreneur: Entrepreneur;
    }>(response);
  }

  // Delete entrepreneur profile (owner or ADMIN)
  async deleteEntrepreneur(id: string) {
    const response = await fetch(`${API_BASE_URL}/entrepreneurs/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      message: string;
    }>(response);
  }

  // List all entrepreneurs (ADMIN only)
  async listEntrepreneurs(filters?: EntrepreneurFilters) {
    const params = new URLSearchParams();
    if (filters?.businessType) {
      params.append('businessType', filters.businessType);
    }
    if (filters?.verified !== undefined) {
      params.append('verified', filters.verified.toString());
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/entrepreneurs?${queryString}`
      : `${API_BASE_URL}/entrepreneurs`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      entrepreneurs: Entrepreneur[];
      total: number;
    }>(response);
  }

  // Verify entrepreneur (ADMIN only)
  async verifyEntrepreneur(id: string) {
    const response = await fetch(`${API_BASE_URL}/entrepreneurs/${id}/verify`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      message: string;
      entrepreneur: Entrepreneur;
    }>(response);
  }
}

export const entrepreneurService = new EntrepreneurService();
