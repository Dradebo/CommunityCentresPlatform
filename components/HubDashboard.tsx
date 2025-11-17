import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import {
  Building,
  Users,
  TrendingUp,
  Calendar,
  Plus,
  MessageSquare,
  BarChart,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity
} from 'lucide-react';
import { apiService } from '../services/api';
import activityService, { HubActivity } from '../services/activity';
import { EnrollmentDialog } from './EnrollmentDialog';
import { EnrollmentList } from './EnrollmentList';
import { LogServiceDialog } from './LogServiceDialog';
import { ServiceProvisionList } from './ServiceProvisionList';

interface HubStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalServices: number;
  monthlyServices: number;
  totalActivities: number;
  recentActivities: HubActivity[];
}

interface HubDashboardProps {
  onNavigate: (view: 'add-center' | 'center-detail' | 'messages') => void;
  onSelectCenter: (centerId: string) => void;
}

export function HubDashboard({ onNavigate, onSelectCenter }: HubDashboardProps) {
  const { user } = useAuth();
  const [center, setCenter] = useState<any>(null);
  const [stats, setStats] = useState<HubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false);
  const [enrollmentRefreshTrigger, setEnrollmentRefreshTrigger] = useState(0);
  const [showLogServiceDialog, setShowLogServiceDialog] = useState(false);
  const [serviceRefreshTrigger, setServiceRefreshTrigger] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all centers and find the one managed by this user
      const centersResponse = await apiService.getCenters();
      const centers = Array.isArray(centersResponse) ? centersResponse : (centersResponse?.centers || []);
      const managedCenter = centers.find((c: any) => c.managerId === user?.id);

      if (!managedCenter) {
        setError('No center assigned yet. Create your center or contact an administrator.');
        setLoading(false);
        return;
      }

      setCenter(managedCenter);

      // Fetch activities for the hub
      const activitiesResponse = await activityService.getHubActivities(managedCenter.id, 1, 5);

      // TODO: Fetch enrollments and services when those endpoints are available
      // For now, we'll use mock data or zeros
      const dashboardStats: HubStats = {
        totalEnrollments: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        totalServices: 0,
        monthlyServices: 0,
        totalActivities: activitiesResponse.pagination.total,
        recentActivities: activitiesResponse.activities,
      };

      setStats(dashboardStats);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCenterDetails = () => {
    if (center) {
      onSelectCenter(center.id);
      onNavigate('center-detail');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !center) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'No center found. Please create a center first.'}
          </AlertDescription>
        </Alert>
        {!center && (
          <div className="mt-4">
            <Button onClick={() => onNavigate('add-center')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your Center
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Building className="h-8 w-8" />
            <span>{center.name}</span>
            {center.verified ? (
              <Badge variant="default" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Verified</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Pending Verification</span>
              </Badge>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{center.location}</p>
        </div>
        <Button onClick={handleViewCenterDetails} variant="outline">
          View Full Details
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeEnrollments || 0} active, {stats?.completedEnrollments || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Provided</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalServices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.monthlyServices || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hub Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalActivities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total posts shared
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowEnrollmentDialog(true)}
              >
                <Plus className="h-3 w-3 mr-2" />
                Enroll Entrepreneur
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowLogServiceDialog(true)}
              >
                <TrendingUp className="h-3 w-3 mr-2" />
                Log Service
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments List */}
      {center && (
        <EnrollmentList
          hubId={center.id}
          refreshTrigger={enrollmentRefreshTrigger}
        />
      )}

      {/* Services List */}
      {center && (
        <ServiceProvisionList
          hubId={center.id}
          refreshTrigger={serviceRefreshTrigger}
        />
      )}

      {/* Enrollment Dialog */}
      {center && (
        <EnrollmentDialog
          isOpen={showEnrollmentDialog}
          onClose={() => setShowEnrollmentDialog(false)}
          hubId={center.id}
          onSuccess={() => {
            setEnrollmentRefreshTrigger(prev => prev + 1);
            loadDashboardData();
          }}
        />
      )}

      {/* Log Service Dialog */}
      {center && (
        <LogServiceDialog
          isOpen={showLogServiceDialog}
          onClose={() => setShowLogServiceDialog(false)}
          hubId={center.id}
          onSuccess={() => {
            setServiceRefreshTrigger(prev => prev + 1);
            loadDashboardData();
          }}
        />
      )}

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activities</span>
            <Button size="sm" onClick={handleViewCenterDetails}>
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.type.toLowerCase().replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No activities yet</p>
              <p className="text-sm mb-4">
                Start sharing updates about your hub's work with entrepreneurs
              </p>
              <Button onClick={handleViewCenterDetails} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Post Your First Activity
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Center Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Center Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Services Offered</h4>
            <div className="flex flex-wrap gap-2">
              {center.services?.map((service: string) => (
                <Badge key={service} variant="secondary">{service}</Badge>
              ))}
            </div>
          </div>
          {center.resources && center.resources.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Resources Available</h4>
              <div className="flex flex-wrap gap-2">
                {center.resources.slice(0, 6).map((resource: string) => (
                  <Badge key={resource} variant="outline" className="border-purple-500 text-purple-700 dark:border-purple-400 dark:text-purple-300">
                    {resource}
                  </Badge>
                ))}
                {center.resources.length > 6 && (
                  <Badge variant="outline" className="border-purple-500 text-purple-700">
                    +{center.resources.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{center.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getActivityColor(type: string) {
  switch (type) {
    case 'ENROLLMENT':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    case 'SERVICE':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    case 'COLLABORATION':
      return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
    case 'ANNOUNCEMENT':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
    case 'CONNECTION':
      return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return 'Yesterday';
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
}
