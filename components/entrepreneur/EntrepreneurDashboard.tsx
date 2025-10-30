import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { entrepreneurService } from '../../services/entrepreneur';
import { enrollmentService } from '../../services/enrollment';
import { serviceProvisionService } from '../../services/serviceProvision';
import { Entrepreneur, HubEnrollment, ServiceProvision } from '../../src/types/entrepreneur';
import { EntrepreneurProfile } from './EntrepreneurProfile';
import {
  Briefcase,
  Building2,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CalendarDays,
  Users
} from 'lucide-react';

interface EntrepreneurDashboardProps {
  userId: string;
}

export const EntrepreneurDashboard: React.FC<EntrepreneurDashboardProps> = ({ userId }) => {
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [enrollments, setEnrollments] = useState<HubEnrollment[]>([]);
  const [services, setServices] = useState<ServiceProvision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('enrollments');

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load entrepreneur profile
      const { entrepreneur: entrepreneurData } = await entrepreneurService.getEntrepreneur(userId);
      setEntrepreneur(entrepreneurData);

      // Load enrollments and services
      const [enrollmentsResult, servicesResult] = await Promise.all([
        enrollmentService.getEntrepreneurEnrollments(entrepreneurData.id),
        serviceProvisionService.getEntrepreneurServices(entrepreneurData.id)
      ]);

      setEnrollments(enrollmentsResult.enrollments);
      setServices(servicesResult.services);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getEnrollmentStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-blue-600"><Package className="h-3 w-3 mr-1" />Active</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!entrepreneur) {
    return (
      <Alert>
        <AlertDescription>No entrepreneur profile found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Entrepreneur Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {entrepreneur.businessName}
        </p>
      </div>

      {/* Verification Alert */}
      {!entrepreneur.verified && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your business profile is pending verification. You'll be able to enroll in more programs once verified by administrators.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
            <Briefcase className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entrepreneur.verified ? (
                <span className="text-green-600">Verified</span>
              ) : (
                <span className="text-orange-600">Pending</span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">Business Profile</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hub Enrollments</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
            <p className="text-xs text-gray-600 mt-1">
              {enrollments.filter(e => e.status === 'ACTIVE').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Received</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-gray-600 mt-1">
              {services.filter(s => s.status === 'ACTIVE').length} ongoing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enrollments">My Enrollments</TabsTrigger>
          <TabsTrigger value="services">Services Received</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments" className="space-y-4 mt-6">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>You're not enrolled in any community centers yet.</p>
                  <p className="text-sm mt-1">Explore the map to find centers and their programs.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {enrollment.hub?.name || 'Community Hub'}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {enrollment.hub?.location || 'Location not available'}
                      </p>
                    </div>
                    {getEnrollmentStatusBadge(enrollment.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {enrollment.enrollmentDate && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <CalendarDays className="h-4 w-4" />
                        Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      </div>
                    )}
                    {enrollment.completionDate && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4" />
                        Completed: {new Date(enrollment.completionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4 mt-6">
          {services.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No services received yet.</p>
                  <p className="text-sm mt-1">Services will appear here when community centers provide them.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{service.serviceType}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Provided by: {service.hub?.name || 'Community Hub'}
                      </p>
                    </div>
                    {getServiceStatusBadge(service.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {service.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">{service.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {service.startDate && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                          <span className="ml-2 font-medium">
                            {new Date(service.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {service.completionDate && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Completion:</span>
                          <span className="ml-2 font-medium">
                            {new Date(service.completionDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {service.collaboratingHub && (
                      <div className="flex items-center gap-2 text-sm p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>
                          Collaboration with: <strong>{service.collaboratingHub.name}</strong>
                        </span>
                      </div>
                    )}

                    {service.investorName && (
                      <div className="flex items-center gap-2 text-sm p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                        <Briefcase className="h-4 w-4 text-purple-600" />
                        <span>
                          Investor: <strong>{service.investorName}</strong>
                          {service.investorDetails && ` - ${service.investorDetails}`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <EntrepreneurProfile entrepreneurId={entrepreneur.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
