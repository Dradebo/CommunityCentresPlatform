import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { Building, MapPin, Phone, Mail, Globe, ExternalLink, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

export const CenterManagerProfile: React.FC = () => {
  const { user } = useAuth();
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadManagedCenter();
  }, []);

  const loadManagedCenter = async () => {
    try {
      setLoading(true);
      // Fetch all centers and find the one managed by this user
      const response = await apiService.getCenters();
      const centers = Array.isArray(response) ? response : (response?.centers || []);
      const managedCenter = centers.find((c: any) => c.managerId === user?.id);

      if (managedCenter) {
        setCenter(managedCenter);
      } else {
        setError('No center assigned yet. Contact an administrator.');
      }
    } catch (err: any) {
      setError('Failed to load center information');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Center Manager Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.pictureUrl || undefined} />
              <AvatarFallback className="text-xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <Badge className="mt-1 bg-blue-500">Center Manager</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Managed Center Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Your Community Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : center ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{center.name}</h3>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{center.location}</span>
                  </div>
                  {center.verified && (
                    <Badge className="mt-2 bg-green-500">Verified</Badge>
                  )}
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300">{center.description}</p>

              <div className="space-y-2 pt-4 border-t">
                {center.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{center.phone}</span>
                  </div>
                )}
                {center.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{center.email}</span>
                  </div>
                )}
                {center.website && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a
                      href={center.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center"
                    >
                      {center.website}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button onClick={() => window.location.hash = `#center-${center.id}`}>
                  View Full Center Details
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No center assigned yet. Contact an administrator to assign you to a community center.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
