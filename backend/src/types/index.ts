import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export interface CommunityCenter {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  services: string[];
  description: string;
  verified: boolean;
  connections: string[];
  addedBy: 'admin' | 'visitor';
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface FilterCriteria {
  searchQuery?: string;
  selectedServices?: string[];
  selectedLocations?: string[];
  verificationStatus?: 'all' | 'verified' | 'unverified';
  connectionStatus?: 'all' | 'connected' | 'standalone';
  addedBy?: 'all' | 'admin' | 'visitor';
}

export interface ContactMessage {
  id: string;
  centerName: string;
  centerId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  inquiryType: string;
  timestamp: Date;
  status: 'pending' | 'forwarded' | 'resolved';
}

export interface CenterMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface MessageThread {
  id: string;
  participants: string[];
  participantNames: string[];
  subject: string;
  lastMessage?: CenterMessage;
  lastActivity: Date;
  messageCount: number;
}