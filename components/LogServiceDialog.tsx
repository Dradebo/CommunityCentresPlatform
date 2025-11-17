import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
import { Loader2 } from 'lucide-react';
import { serviceProvisionService } from '../services/serviceProvision';
import { enrollmentService } from '../services/enrollment';
import { apiService } from '../services/api';
import type { HubEnrollment } from '../src/types/entrepreneur';

interface LogServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  onSuccess: () => void;
}

interface CollaboratingHub {
  id: string;
  name: string;
  location: string;
  verified: boolean;
}

export function LogServiceDialog({ isOpen, onClose, hubId, onSuccess }: LogServiceDialogProps) {
  const [enrollments, setEnrollments] = useState<HubEnrollment[]>([]);
  const [collaboratingHubs, setCollaboratingHubs] = useState<CollaboratingHub[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [loadingHubs, setLoadingHubs] = useState(false);

  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [collaboratingHubId, setCollaboratingHubId] = useState('');
  const [investorName, setInvestorName] = useState('');
  const [investorDetails, setInvestorDetails] = useState('');
  const [startDate, setStartDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEnrollments();
      loadCollaboratingHubs();
      setError('');
    }
  }, [isOpen]);

  const loadEnrollments = async () => {
    try {
      setLoadingEnrollments(true);
      const response = await enrollmentService.getHubEnrollments(hubId, { status: 'ACTIVE' as any });
      setEnrollments(response.enrollments);
    } catch (err: any) {
      console.error('Failed to load enrollments:', err);
      setError('Failed to load enrolled entrepreneurs');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const loadCollaboratingHubs = async () => {
    try {
      setLoadingHubs(true);
      // Load all verified centers except current hub
      const response = await apiService.get<any[]>('/centers');
      const otherHubs = response.filter((center: any) =>
        center.id !== hubId && center.verified === true
      );
      setCollaboratingHubs(otherHubs);
    } catch (err: any) {
      console.error('Failed to load hubs:', err);
      // Non-critical error, just log it
    } finally {
      setLoadingHubs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntrepreneur) {
      setError('Please select an entrepreneur');
      return;
    }
    if (!serviceType.trim() || serviceType.trim().length < 2) {
      setError('Service type must be at least 2 characters');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const requestData: any = {
        hubId,
        entrepreneurId: selectedEntrepreneur,
        serviceType: serviceType.trim(),
        description: description.trim(),
      };

      // Add optional fields only if they have values
      if (collaboratingHubId) {
        requestData.collaboratingHubId = collaboratingHubId;
      }
      if (investorName.trim()) {
        requestData.investorName = investorName.trim();
      }
      if (investorDetails.trim()) {
        requestData.investorDetails = investorDetails.trim();
      }
      if (startDate) {
        // Convert YYYY-MM-DD to ISO8601
        requestData.startDate = new Date(startDate).toISOString();
      }

      await serviceProvisionService.createServiceProvision(requestData);

      // Reset form
      setSelectedEntrepreneur('');
      setServiceType('');
      setDescription('');
      setCollaboratingHubId('');
      setInvestorName('');
      setInvestorDetails('');
      setStartDate('');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to log service:', err);
      setError(err.message || 'Failed to log service provision');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedEntrepreneur('');
      setServiceType('');
      setDescription('');
      setCollaboratingHubId('');
      setInvestorName('');
      setInvestorDetails('');
      setStartDate('');
      setError('');
      onClose();
    }
  };

  const selectedEnrollment = enrollments.find(e => e.entrepreneurId === selectedEntrepreneur);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Service Provision</DialogTitle>
          <DialogDescription>
            Record a service or program delivered to an enrolled entrepreneur. Status will be set to PENDING initially.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Entrepreneur Selection */}
          <div className="space-y-2">
            <Label htmlFor="entrepreneur">
              Select Entrepreneur <span className="text-red-500">*</span>
            </Label>
            {loadingEnrollments ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading enrolled entrepreneurs...</span>
              </div>
            ) : enrollments.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No active enrollments found. Enroll an entrepreneur first before logging services.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Select
                  value={selectedEntrepreneur}
                  onValueChange={setSelectedEntrepreneur}
                  disabled={loading}
                >
                  <SelectTrigger id="entrepreneur">
                    <SelectValue placeholder="Select an enrolled entrepreneur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map(enrollment => (
                      <SelectItem key={enrollment.id} value={enrollment.entrepreneurId}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {enrollment.entrepreneur?.businessName || 'Unknown Business'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {enrollment.entrepreneur?.businessType}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEnrollment?.entrepreneur && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p><strong>Business:</strong> {selectedEnrollment.entrepreneur.businessName}</p>
                    <p><strong>Type:</strong> {selectedEnrollment.entrepreneur.businessType}</p>
                    {selectedEnrollment.entrepreneur.description && (
                      <p><strong>Description:</strong> {selectedEnrollment.entrepreneur.description}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="serviceType">
              Service Type <span className="text-red-500">*</span>
            </Label>
            <Input
              id="serviceType"
              placeholder="E.g., Business Skills Training, Financial Literacy Workshop, Mentorship"
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
              disabled={loading}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Brief name for the type of service being provided (min 2 characters)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Service Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the service in detail: what was provided, objectives, duration, key outcomes expected..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Detailed description (minimum 10 characters)
            </p>
          </div>

          {/* Collaborating Hub (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="collaboratingHub">
              Collaborating Hub <span className="text-gray-500">(Optional)</span>
            </Label>
            <Select
              value={collaboratingHubId}
              onValueChange={setCollaboratingHubId}
              disabled={loading || loadingHubs}
            >
              <SelectTrigger id="collaboratingHub">
                <SelectValue placeholder="Select a collaborating hub (optional)..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (solo provision)</SelectItem>
                {collaboratingHubs.map(hub => (
                  <SelectItem key={hub.id} value={hub.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{hub.name}</span>
                      <span className="text-xs text-gray-500">{hub.location}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If another hub is collaborating on this service, select it here
            </p>
          </div>

          {/* Investor Fields (Optional) */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Investor Information <span className="text-gray-500 font-normal">(Optional)</span>
            </h4>

            <div className="space-y-2">
              <Label htmlFor="investorName">Investor Name</Label>
              <Input
                id="investorName"
                placeholder="E.g., Kampala Innovation Fund, Private Investor"
                value={investorName}
                onChange={e => setInvestorName(e.target.value)}
                disabled={loading}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investorDetails">Investor Details</Label>
              <Textarea
                id="investorDetails"
                placeholder="Additional information about the investor's involvement, funding amount, terms, etc..."
                value={investorDetails}
                onChange={e => setInvestorDetails(e.target.value)}
                disabled={loading}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Start Date (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="startDate">
              Start Date <span className="text-gray-500">(Optional)</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              When this service began or is scheduled to begin
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || enrollments.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging Service...
                </>
              ) : (
                'Log Service'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
