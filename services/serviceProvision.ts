import { API_BASE_URL } from '../utils/env';
import type {
  ServiceProvision,
  CreateServiceProvisionRequest,
  UpdateServiceProvisionRequest,
  ServiceProvisionFilters,
} from '../src/types/entrepreneur';

class ServiceProvisionService {
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

  // Create service provision (ADMIN/CENTER_MANAGER)
  async createServiceProvision(data: CreateServiceProvisionRequest) {
    const response = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{
      message: string;
      service: ServiceProvision;
    }>(response);
  }

  // Get services provided by a hub (ADMIN/CENTER_MANAGER)
  async getHubServices(hubId: string, filters?: ServiceProvisionFilters) {
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.serviceType) {
      params.append('serviceType', filters.serviceType);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/services/hub/${hubId}?${queryString}`
      : `${API_BASE_URL}/services/hub/${hubId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      services: ServiceProvision[];
      total: number;
    }>(response);
  }

  // Get services received by an entrepreneur
  async getEntrepreneurServices(entrepreneurId: string, filters?: ServiceProvisionFilters) {
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.serviceType) {
      params.append('serviceType', filters.serviceType);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/services/entrepreneur/${entrepreneurId}?${queryString}`
      : `${API_BASE_URL}/services/entrepreneur/${entrepreneurId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      services: ServiceProvision[];
      total: number;
    }>(response);
  }

  // Get single service provision details
  async getServiceProvision(id: string) {
    const response = await fetch(`${API_BASE_URL}/services/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      service: ServiceProvision;
    }>(response);
  }

  // Update service provision (ADMIN/CENTER_MANAGER)
  async updateServiceProvision(id: string, data: UpdateServiceProvisionRequest) {
    const response = await fetch(`${API_BASE_URL}/services/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{
      message: string;
      service: ServiceProvision;
    }>(response);
  }
}

export const serviceProvisionService = new ServiceProvisionService();
