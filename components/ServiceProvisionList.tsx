import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { Package, Calendar, CheckCircle, Clock, XCircle, AlertCircle, Building2, Users, DollarSign } from 'lucide-react';
import { serviceProvisionService } from '../services/serviceProvision';
import type { ServiceProvision } from '../src/types/entrepreneur';

interface ServiceProvisionListProps {
  hubId: string;
  refreshTrigger?: number;
}

export function ServiceProvisionList({ hubId, refreshTrigger }: ServiceProvisionListProps) {
  const [services, setServices] = useState<ServiceProvision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingOutcome, setUpdatingOutcome] = useState<string | null>(null);
  const [outcomeText, setOutcomeText] = useState<Record<string, string>>({});

  useEffect(() => {
    loadServices();
  }, [hubId, refreshTrigger]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await serviceProvisionService.getHubServices(hubId);
      setServices(response.services);
    } catch (err: any) {
      console.error('Failed to load services:', err);
      setError(err.message || 'Failed to load service provisions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (serviceId: string, newStatus: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => {
    try {
      setUpdatingStatus(serviceId);
      await serviceProvisionService.updateServiceProvision(serviceId, { status: newStatus as any });
      await loadServices(); // Refresh list
    } catch (err: any) {
      console.error('Failed to update service status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleOutcomeSubmit = async (serviceId: string) => {
    const outcome = outcomeText[serviceId];
    if (!outcome || !outcome.trim()) {
      setError('Outcome description is required');
      return;
    }

    try {
      setUpdatingOutcome(serviceId);
      await serviceProvisionService.updateServiceProvision(serviceId, { outcome: outcome.trim() });
      await loadServices(); // Refresh list
      setOutcomeText(prev => ({ ...prev, [serviceId]: '' })); // Clear input
    } catch (err: any) {
      console.error('Failed to update outcome:', err);
      setError(err.message || 'Failed to update outcome');
    } finally {
      setUpdatingOutcome(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Package className="h-3 w-3" />;
      case 'COMPLETED':
        return <CheckCircle className="h-3 w-3" />;
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      case 'CANCELLED':
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeCount = services.filter(s => s.status === 'ACTIVE').length;
  const completedCount = services.filter(s => s.status === 'COMPLETED').length;
  const pendingCount = services.filter(s => s.status === 'PENDING').length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Services Provided</span>
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm">
            {pendingCount > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {pendingCount} Pending
              </Badge>
            )}
            {activeCount > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {activeCount} Active
              </Badge>
            )}
            {completedCount > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {completedCount} Completed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {services.length === 0 ? (
          <Alert>
            <AlertDescription>
              <p className="font-semibold mb-1">No services logged yet</p>
              <p className="text-sm">
                Click "Log Service" above to record services provided to your enrolled entrepreneurs.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {services.map(service => (
              <div
                key={service.id}
                className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span>{service.serviceType}</span>
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      For: {service.entrepreneur?.businessName || 'Unknown Entrepreneur'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(service.status)} flex items-center space-x-1`}
                  >
                    {getStatusIcon(service.status)}
                    <span>{service.status}</span>
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {service.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {service.entrepreneur && (
                    <span className="flex items-center">
                      <Badge variant="secondary" className="mr-2">
                        {service.entrepreneur.businessType}
                      </Badge>
                    </span>
                  )}
                  {service.startDate && (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Started: {formatDate(service.startDate)}
                    </span>
                  )}
                  {service.completionDate && (
                    <span className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completed: {formatDate(service.completionDate)}
                    </span>
                  )}
                  <span className="flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Created: {formatDate(service.createdAt)}
                  </span>
                </div>

                {/* Collaborating Hub */}
                {service.collaboratingHub && (
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm flex items-center text-blue-800 dark:text-blue-200">
                      <Building2 className="h-4 w-4 mr-2" />
                      <strong>Collaborating Hub:</strong>&nbsp;
                      {service.collaboratingHub.name} ({service.collaboratingHub.location})
                    </p>
                  </div>
                )}

                {/* Investor Info */}
                {(service.investorName || service.investorDetails) && (
                  <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                    <div className="text-sm text-purple-800 dark:text-purple-200">
                      <p className="flex items-center font-semibold mb-1">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Investor Information
                      </p>
                      {service.investorName && (
                        <p><strong>Name:</strong> {service.investorName}</p>
                      )}
                      {service.investorDetails && (
                        <p><strong>Details:</strong> {service.investorDetails}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Outcome (if completed or cancelled) */}
                {service.outcome && (
                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Outcome:</strong> {service.outcome}
                    </p>
                  </div>
                )}

                {/* Status and Outcome Controls */}
                <div className="space-y-3 pt-3 border-t">
                  {/* Status Update */}
                  <div className="flex items-center space-x-2">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Update Status:
                    </Label>
                    <Select
                      value={service.status}
                      onValueChange={(value) => handleStatusChange(service.id, value as 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED')}
                      disabled={updatingStatus === service.id}
                    >
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Outcome Input (show for completed/cancelled or if already has outcome) */}
                  {(service.status === 'COMPLETED' || service.status === 'CANCELLED' || service.outcome) && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">
                        {service.outcome ? 'Update Outcome:' : 'Add Outcome:'}
                      </Label>
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Describe the final outcome, results achieved, lessons learned..."
                          value={outcomeText[service.id] || ''}
                          onChange={e => setOutcomeText(prev => ({ ...prev, [service.id]: e.target.value }))}
                          disabled={updatingOutcome === service.id}
                          rows={2}
                          className="text-sm resize-none"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleOutcomeSubmit(service.id)}
                          disabled={updatingOutcome === service.id || !outcomeText[service.id]?.trim()}
                        >
                          {updatingOutcome === service.id ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
