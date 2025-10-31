import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ContactCenterForm } from './ContactCenterForm';
import { CenterMessaging } from './CenterMessaging';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Link,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';

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
  centerName: string;
  centerId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  inquiryType: string;
}

interface CommunityCenterProps {
  center: CommunityCenterData;
  allCenters: CommunityCenterData[];
  onConnectCenter: (center1Id: string, center2Id: string) => void;
  onSendContactMessage: (message: ContactMessage) => void;
  onBackToMap: () => void;
  isAdmin: boolean;
}

export function CommunityCenter({ center, allCenters, onConnectCenter, onSendContactMessage, onBackToMap, isAdmin }: CommunityCenterProps) {
  const [connectionTarget, setConnectionTarget] = useState<string>('');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);

  const connectedCenters = center.connections.map(connectionId => 
    allCenters.find(c => c.id === connectionId)
  ).filter(Boolean) as CommunityCenterData[];

  const availableForConnection = allCenters.filter(c => 
    c.id !== center.id && 
    !center.connections.includes(c.id) &&
    c.verified
  );

  const handleCreateConnection = () => {
    if (connectionTarget) {
      onConnectCenter(center.id, connectionTarget);
      setConnectionTarget('');
      setShowConnectionDialog(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={onBackToMap}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Map
      </Button>

      {/* Main Center Information */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center space-x-3">
                <span>{center.name}</span>
                {center.verified ? (
                  <Badge variant="default" className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Verified</span>
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Unverified</span>
                  </Badge>
                )}
              </CardTitle>
              <p className="text-gray-600 flex items-center mt-2">
                <MapPin className="h-4 w-4 mr-2" />
                {center.location}
              </p>
            </div>
            <div className="flex space-x-2">
              {/* Contact Center Button for Visitors */}
              {!isAdmin && (
                <ContactCenterForm 
                  center={center}
                  onSendMessage={onSendContactMessage}
                />
              )}
              
              {/* Create Connection Button for Admins */}
              {isAdmin && availableForConnection.length > 0 && (
                <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Link className="h-4 w-4 mr-2" />
                      Create Connection
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect to Another Center</DialogTitle>
                      <DialogDescription>
                        Connect {center.name} with another community center to enable collaboration and resource sharing.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={connectionTarget} onValueChange={setConnectionTarget}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a center to connect with..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableForConnection.map(availableCenter => (
                            <SelectItem key={availableCenter.id} value={availableCenter.id}>
                              {availableCenter.name} - {availableCenter.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleCreateConnection} 
                        disabled={!connectionTarget}
                        className="w-full"
                      >
                        Create Connection
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg mb-2">About</h3>
            <p className="text-gray-700">{center.description}</p>
          </div>

          <div>
            <h3 className="text-lg mb-3">Services Offered</h3>
            <div className="flex flex-wrap gap-2">
              {center.services.map(service => (
                <Badge key={service} variant="secondary">{service}</Badge>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          {(center.contactInfo.phone || center.contactInfo.email || center.contactInfo.website) && (
            <div>
              <h3 className="text-lg mb-3">Contact Information</h3>
              <div className="space-y-2">
                {center.contactInfo.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{center.contactInfo.phone}</span>
                  </div>
                )}
                {center.contactInfo.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a href={`mailto:${center.contactInfo.email}`} className="text-blue-600 hover:underline">
                      {center.contactInfo.email}
                    </a>
                  </div>
                )}
                {center.contactInfo.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a 
                      href={center.contactInfo.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {center.contactInfo.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Centers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Connected Centers ({connectedCenters.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectedCenters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectedCenters.map(connectedCenter => (
                <div key={connectedCenter.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg">{connectedCenter.name}</h4>
                    {connectedCenter.verified && (
                      <Badge variant="default" className="text-xs">Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {connectedCenter.location}
                  </p>
                  <p className="text-sm mb-3">{connectedCenter.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {connectedCenter.services.slice(0, 3).map(service => (
                      <Badge key={service} variant="outline" className="text-xs">{service}</Badge>
                    ))}
                    {connectedCenter.services.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{connectedCenter.services.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Connected for collaboration and resource sharing
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>This center hasn't connected with other centers yet.</p>
              {isAdmin && availableForConnection.length > 0 && (
                <p className="text-sm mt-2">Use the "Create Connection" button above to connect with other centers.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Map */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 rounded-lg p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <p className="text-lg mb-2">{center.name}</p>
            <p className="text-gray-600">{center.location}</p>
            <p className="text-sm text-gray-500 mt-2">
              Coordinates: {center.coordinates.lat.toFixed(4)}, {center.coordinates.lng.toFixed(4)}
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                Open in Maps
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}