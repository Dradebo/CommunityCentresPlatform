import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Users, Calendar, CheckCircle, Clock, XCircle, Pause } from 'lucide-react';
import { enrollmentService } from '../services/enrollment';

import type { HubEnrollment } from '../src/types/entrepreneur';

interface EnrollmentListProps {
  hubId: string;
  refreshTrigger?: number;
}

export function EnrollmentList({ hubId, refreshTrigger }: EnrollmentListProps) {
  const [enrollments, setEnrollments] = useState<HubEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadEnrollments();
  }, [hubId, refreshTrigger]);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await enrollmentService.getHubEnrollments(hubId);
      setEnrollments(response.enrollments || []);
    } catch (err: any) {
      console.error('Failed to load enrollments:', err);
      setError(err.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (enrollmentId: string, newStatus: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED') => {
    try {
      setUpdatingStatus(enrollmentId);
      await enrollmentService.updateEnrollmentStatus(enrollmentId, { status: newStatus as any });
      await loadEnrollments(); // Refresh list
    } catch (err: any) {
      console.error('Failed to update enrollment status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'SUSPENDED':
        return <Pause className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Enrollments</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Enrollments ({enrollments.length})</span>
          </div>
          {enrollments.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                {enrollments.filter(e => e.status === 'ACTIVE').length} Active
              </Badge>
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                {enrollments.filter(e => e.status === 'COMPLETED').length} Completed
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {enrollments.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No enrollments yet</p>
            <p className="text-sm">
              Enroll entrepreneurs in your programs to start tracking their progress
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {enrollment.entrepreneur?.businessName || 'Unknown Business'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {enrollment.entrepreneur?.businessType || 'Business Type Not Specified'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(enrollment.status)} flex items-center space-x-1`}
                  >
                    {getStatusIcon(enrollment.status)}
                    <span>{enrollment.status}</span>
                  </Badge>
                </div>

                {enrollment.entrepreneur?.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {enrollment.entrepreneur.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {enrollment.entrepreneur && (
                    <>
                      <span className="flex items-center">
                        <Badge variant="secondary" className="mr-2">
                          {enrollment.entrepreneur.businessType}
                        </Badge>
                      </span>
                      {enrollment.entrepreneur.verified && (
                        <span className="text-green-600 dark:text-green-400">✓ Verified</span>
                      )}
                    </>
                  )}
                  {enrollment.enrollmentDate && (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Enrolled: {formatDate(enrollment.enrollmentDate)}
                    </span>
                  )}
                  {enrollment.completionDate && (
                    <span className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completed: {formatDate(enrollment.completionDate)}
                    </span>
                  )}
                  <span className="flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Created: {formatDate(enrollment.createdAt)}
                  </span>
                </div>

                {enrollment.status !== 'COMPLETED' && (
                  <div className="flex items-center space-x-2">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Update Status:
                    </Label>
                    <Select
                      value={enrollment.status}
                      onValueChange={(value) => handleStatusChange(enrollment.id, value as 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED')}
                      disabled={updatingStatus === enrollment.id}
                    >
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingStatus === enrollment.id && (
                      <span className="text-xs text-gray-500">Updating...</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Missing Label import - inline definition
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
