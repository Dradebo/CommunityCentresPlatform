import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle, AlertTriangle, Users, Eye, Link, Mail, MessageCircle } from 'lucide-react';

interface CommunityCenterData {
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

interface ContactMessage {
  id: string;
  centerName: string;
  centerId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  inquiryType: string;
  timestamp: Date;
  status: 'pending' | 'forwarded';
}

interface AdminDashboardProps {
  centers: CommunityCenterData[];
  unverifiedCenters: CommunityCenterData[];
  contactMessages?: ContactMessage[];
  onVerifyCenter: (centerId: string) => void;
  onConnectCenters: (center1Id: string, center2Id: string) => void;
}

export function AdminDashboard({ centers, unverifiedCenters, contactMessages = [], onVerifyCenter, onConnectCenters }: AdminDashboardProps) {
  const [selectedCenterForConnection, setSelectedCenterForConnection] = useState<string>('');
  const [connectionTarget, setConnectionTarget] = useState<string>('');

  const handleCreateConnection = () => {
    if (selectedCenterForConnection && connectionTarget && selectedCenterForConnection !== connectionTarget) {
      onConnectCenters(selectedCenterForConnection, connectionTarget);
      setSelectedCenterForConnection('');
      setConnectionTarget('');
    }
  };

  const verifiedCenters = centers.filter(center => center.verified);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage and verify community centers across Kampala</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Centers</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{centers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{verifiedCenters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Verification</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{unverifiedCenters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Contact Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{contactMessages.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verification */}
      {unverifiedCenters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Centers Pending Verification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unverifiedCenters.map(center => (
                <div key={center.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg">{center.name}</h3>
                      <p className="text-sm text-gray-600">{center.location}</p>
                      <Badge variant="outline" className="mt-1">
                        Added by {center.addedBy}
                      </Badge>
                    </div>
                    <Button onClick={() => onVerifyCenter(center.id)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                  </div>
                  <p className="text-sm mb-3">{center.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {center.services.map(service => (
                      <Badge key={service} variant="secondary">{service}</Badge>
                    ))}
                  </div>
                  {center.contactInfo.phone && (
                    <p className="text-sm text-gray-600 mt-2">📞 {center.contactInfo.phone}</p>
                  )}
                  {center.contactInfo.email && (
                    <p className="text-sm text-gray-600">📧 {center.contactInfo.email}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Messages */}
      {contactMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span>Contact Messages ({contactMessages.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contactMessages.slice(0, 5).map(message => (
                <div key={message.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm">{message.subject}</h4>
                      <p className="text-xs text-gray-600">
                        From: {message.senderName} ({message.senderEmail})
                      </p>
                      <p className="text-xs text-gray-600">
                        To: {message.centerName} • {message.inquiryType}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {message.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm">{message.message}</p>
                  <div className="mt-2">
                    <Badge variant={message.status === 'forwarded' ? 'default' : 'secondary'}>
                      {message.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {contactMessages.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{contactMessages.length - 5} more messages
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-purple-600" />
            <span>Create Center Connections</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm mb-2 block">Select First Center</label>
              <Select value={selectedCenterForConnection} onValueChange={setSelectedCenterForConnection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose center..." />
                </SelectTrigger>
                <SelectContent>
                  {verifiedCenters.map(center => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm mb-2 block">Select Second Center</label>
              <Select value={connectionTarget} onValueChange={setConnectionTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose center..." />
                </SelectTrigger>
                <SelectContent>
                  {verifiedCenters
                    .filter(center => center.id !== selectedCenterForConnection)
                    .map(center => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCreateConnection}
                disabled={!selectedCenterForConnection || !connectionTarget}
                className="w-full"
              >
                Create Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Centers Management */}
      <Card>
        <CardHeader>
          <CardTitle>All Community Centers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {centers.map(center => (
              <div key={center.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg">{center.name}</h3>
                      {center.verified ? (
                        <Badge variant="default">Verified</Badge>
                      ) : (
                        <Badge variant="destructive">Unverified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{center.location}</p>
                  </div>
                </div>
                <p className="text-sm mb-3">{center.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {center.services.map(service => (
                    <Badge key={service} variant="secondary">{service}</Badge>
                  ))}
                </div>
                {center.connections.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <strong>Connected to:</strong> {center.connections.length} center(s)
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}