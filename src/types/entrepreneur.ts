// TypeScript interfaces matching Go backend models

export enum EnrollmentStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
}

export enum ServiceProvisionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Entrepreneur {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  description: string;
  phone?: string;
  email?: string;
  website?: string;
  verified: boolean;
  enrollmentCount?: number;
  servicesCount?: number;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface HubEnrollment {
  id: string;
  hubId: string;
  entrepreneurId: string;
  status: EnrollmentStatus;
  enrollmentDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
  hub?: {
    id: string;
    name: string;
    location: string;
    description?: string;
    verified: boolean;
  };
  entrepreneur?: {
    id: string;
    businessName: string;
    businessType: string;
    description?: string;
    verified: boolean;
    user?: {
      name: string;
      email: string;
    };
  };
}

export interface ServiceProvision {
  id: string;
  hubId: string;
  entrepreneurId: string;
  serviceType: string;
  description: string;
  collaboratingHubId?: string;
  investorName?: string;
  investorDetails?: string;
  startDate?: string;
  completionDate?: string;
  status: ServiceProvisionStatus;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
  hub?: {
    id: string;
    name: string;
    location: string;
    description?: string;
  };
  entrepreneur?: {
    id: string;
    businessName: string;
    businessType: string;
    user?: {
      name: string;
      email: string;
    };
  };
  collaboratingHub?: {
    id: string;
    name: string;
    location: string;
  };
}

// Request/Response types for API calls
export interface CreateEntrepreneurRequest {
  businessName: string;
  businessType: string;
  description: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdateEntrepreneurRequest {
  businessName: string;
  businessType: string;
  description: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface CreateEnrollmentRequest {
  hubId: string;
  entrepreneurId: string;
}

export interface UpdateEnrollmentStatusRequest {
  status: EnrollmentStatus;
}

export interface CreateServiceProvisionRequest {
  hubId: string;
  entrepreneurId: string;
  serviceType: string;
  description: string;
  collaboratingHubId?: string;
  investorName?: string;
  investorDetails?: string;
  startDate?: string; // ISO8601 format
}

export interface UpdateServiceProvisionRequest {
  status?: ServiceProvisionStatus;
  outcome?: string;
  completionDate?: string; // ISO8601 format
}

// List filters
export interface EntrepreneurFilters {
  businessType?: string;
  verified?: boolean;
}

export interface EnrollmentFilters {
  status?: EnrollmentStatus;
}

export interface ServiceProvisionFilters {
  status?: ServiceProvisionStatus;
  serviceType?: string;
}
