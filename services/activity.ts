import { apiService } from './api';

export interface HubActivity {
  id: string;
  hubId: string;
  type: 'ENROLLMENT' | 'SERVICE' | 'COLLABORATION' | 'ANNOUNCEMENT' | 'CONNECTION';
  title: string;
  description: string;
  entrepreneurId?: string;
  entrepreneurName?: string;
  serviceProvisionId?: string;
  serviceType?: string;
  connectionId?: string;
  collaboratingHubId?: string;
  collaboratingHubName?: string;
  imageUrl?: string;
  pinned: boolean;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityRequest {
  hubId: string;
  type: 'ENROLLMENT' | 'SERVICE' | 'COLLABORATION' | 'ANNOUNCEMENT' | 'CONNECTION';
  title: string;
  description: string;
  entrepreneurId?: string;
  serviceProvisionId?: string;
  connectionId?: string;
  collaboratingHubId?: string;
  pinned?: boolean;
}

export interface UpdateActivityRequest {
  title?: string;
  description?: string;
}

export interface PaginatedActivities {
  activities: HubActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ActivityService {
  /**
   * Create a new activity (CENTER_MANAGER only)
   */
  async createActivity(data: CreateActivityRequest): Promise<{ message: string; activity: HubActivity }> {
    return await apiService.post<{ message: string; activity: HubActivity }>('/activities', data);
  }

  /**
   * Get activities for a specific hub (public)
   */
  async getHubActivities(
    hubId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedActivities> {
    return await apiService.get<PaginatedActivities>(
      `/activities/hub/${hubId}?page=${page}&limit=${limit}`
    );
  }

  /**
   * Update an activity (creator only)
   */
  async updateActivity(
    activityId: string,
    data: UpdateActivityRequest
  ): Promise<{ message: string; activity: HubActivity }> {
    return await apiService.put<{ message: string; activity: HubActivity }>(
      `/activities/${activityId}`,
      data
    );
  }

  /**
   * Delete an activity (creator only)
   */
  async deleteActivity(activityId: string): Promise<{ message: string }> {
    return await apiService.delete<{ message: string }>(`/activities/${activityId}`);
  }

  /**
   * Pin or unpin an activity (CENTER_MANAGER only)
   */
  async pinActivity(activityId: string, pinned: boolean): Promise<{ message: string; activity: HubActivity }> {
    return await apiService.patch<{ message: string; activity: HubActivity }>(
      `/activities/${activityId}/pin`,
      { pinned }
    );
  }
}

export default new ActivityService();
