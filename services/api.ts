// Static-only API service for the Community Centres public directory.
// Railway/backend dependencies were removed so the public site can keep working
// as a browse + contact surface backed by versioned JSON data.

const STATIC_CENTERS_URL = '/centers.json';
const STATIC_MODE_ERROR = 'This action is unavailable in the current site mode.';

let staticCentersCache: any[] | null = null;

class APIService {
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  private unsupported(action = STATIC_MODE_ERROR): never {
    throw new Error(action);
  }

  private async loadStaticCenters(): Promise<any[]> {
    if (staticCentersCache) return staticCentersCache;

    const response = await fetch(STATIC_CENTERS_URL);
    if (!response.ok) {
      throw new Error('Failed to load community centres data');
    }

    const data = await response.json();
    staticCentersCache = Array.isArray(data) ? data : [];
    return staticCentersCache;
  }

  private filterCenters(
    centers: any[],
    filters?: {
      searchQuery?: string;
      services?: string[];
      locations?: string[];
      verificationStatus?: string;
      connectionStatus?: string;
      addedBy?: string;
    }
  ): any[] {
    if (!filters) return centers;

    return centers.filter((center) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchText = `${center.name ?? ''} ${center.location ?? ''} ${center.description ?? ''} ${(center.services ?? []).join(' ')}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }

      if (filters.services && filters.services.length > 0) {
        if (!filters.services.some((service: string) => center.services?.includes(service))) return false;
      }

      if (filters.locations && filters.locations.length > 0) {
        if (!filters.locations.some((location: string) => center.location?.includes(location))) return false;
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

  async register(_userData: {
    email: string;
    password: string;
    name: string;
    role?: 'VISITOR' | 'CENTER_MANAGER' | 'ENTREPRENEUR';
  }): Promise<{ message: string; token: string; user: null }> {
    return Promise.reject(new Error(STATIC_MODE_ERROR));
  }

  async login(_credentials: { email: string; password: string }): Promise<{ message: string; token: string; user: null }> {
    return Promise.reject(new Error(STATIC_MODE_ERROR));
  }

  async loginWithGoogle(_credential: string): Promise<{ message: string; token: string; user: null }> {
    return Promise.reject(new Error(STATIC_MODE_ERROR));
  }

  async getCurrentUser() {
    return { user: null };
  }

  logout() {
    try {
      localStorage.removeItem('auth_token');
    } catch {
      // ignore storage errors in static mode
    }
  }

  async getCenters(filters?: {
    searchQuery?: string;
    services?: string[];
    locations?: string[];
    verificationStatus?: string;
    connectionStatus?: string;
    addedBy?: string;
  }) {
    const centers = await this.loadStaticCenters();
    return { centers: this.filterCenters(centers, filters) };
  }

  async getCenter(id: string) {
    const centers = await this.loadStaticCenters();
    const center = centers.find((item) => String(item.id) === String(id));
    if (!center) {
      throw new Error('Community centre not found');
    }
    return { center };
  }

  async createCenter(_centerData: {
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
    this.unsupported();
  }

  async verifyCenter(_centerId: string) {
    this.unsupported();
  }

  async connectCenters(_center1Id: string, _center2Id: string) {
    this.unsupported();
  }

  async getContactMessages() {
    this.unsupported();
  }

  async sendContactMessage(_messageData: {
    centerId: string;
    subject: string;
    message: string;
    inquiryType: string;
  }) {
    this.unsupported();
  }

  async getMessageThreads(_centerId: string) {
    this.unsupported();
  }

  async getThreadMessages(_threadId: string) {
    this.unsupported();
  }

  async sendThreadMessage(_threadId: string, _content: string) {
    this.unsupported();
  }

  async createMessageThread(_threadData: {
    participantIds: string[];
    subject: string;
    initialMessage: string;
  }) {
    this.unsupported();
  }

  async get<T = any>(_endpoint: string): Promise<T> {
    this.unsupported();
  }

  async post<T = any>(_endpoint: string, _data?: any): Promise<T> {
    this.unsupported();
  }

  async put<T = any>(_endpoint: string, _data?: any): Promise<T> {
    this.unsupported();
  }

  async patch<T = any>(_endpoint: string, _data?: any): Promise<T> {
    this.unsupported();
  }

  async delete<T = any>(_endpoint: string): Promise<T> {
    this.unsupported();
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  async createRoleUpgradeRequest(_data: {
    requestedRole: string;
    centerId?: string;
    justification: string;
  }) {
    this.unsupported();
  }

  async getMyUpgradeRequest() {
    this.unsupported();
  }

  async getRoleUpgradeRequests(_status?: string) {
    this.unsupported();
  }

  async reviewRoleUpgradeRequest(
    _requestId: string,
    _data: {
      action: 'approve' | 'reject';
      notes?: string;
    }
  ) {
    this.unsupported();
  }
}

export const apiService = new APIService();