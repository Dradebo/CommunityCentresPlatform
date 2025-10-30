import { API_BASE_URL } from '../utils/env';
import type {
  HubEnrollment,
  CreateEnrollmentRequest,
  UpdateEnrollmentStatusRequest,
  EnrollmentFilters,
} from '../src/types/entrepreneur';

class EnrollmentService {
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

  // Create enrollment (CENTER_MANAGER creates active, ENTREPRENEUR requests pending)
  async createEnrollment(data: CreateEnrollmentRequest) {
    const response = await fetch(`${API_BASE_URL}/enrollments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{
      message: string;
      enrollment: HubEnrollment;
    }>(response);
  }

  // Get enrollments for a hub (ADMIN/CENTER_MANAGER)
  async getHubEnrollments(hubId: string, filters?: EnrollmentFilters) {
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append('status', filters.status);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/enrollments/hub/${hubId}?${queryString}`
      : `${API_BASE_URL}/enrollments/hub/${hubId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      enrollments: HubEnrollment[];
      total: number;
    }>(response);
  }

  // Get enrollments for an entrepreneur
  async getEntrepreneurEnrollments(entrepreneurId: string, filters?: EnrollmentFilters) {
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append('status', filters.status);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/enrollments/entrepreneur/${entrepreneurId}?${queryString}`
      : `${API_BASE_URL}/enrollments/entrepreneur/${entrepreneurId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      enrollments: HubEnrollment[];
      total: number;
    }>(response);
  }

  // Get single enrollment details
  async getEnrollment(id: string) {
    const response = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      enrollment: HubEnrollment;
    }>(response);
  }

  // Update enrollment status (ADMIN/CENTER_MANAGER)
  async updateEnrollmentStatus(id: string, data: UpdateEnrollmentStatusRequest) {
    const response = await fetch(`${API_BASE_URL}/enrollments/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{
      message: string;
      enrollment: HubEnrollment;
    }>(response);
  }
}

export const enrollmentService = new EnrollmentService();
