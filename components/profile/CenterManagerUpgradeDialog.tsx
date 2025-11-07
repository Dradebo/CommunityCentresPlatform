import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Building, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

interface CenterManagerUpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CenterManagerUpgradeDialog: React.FC<CenterManagerUpgradeDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    centerId: '',
    justification: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadCenters();
    }
  }, [isOpen]);

  const loadCenters = async () => {
    try {
      const response = await apiService.getCenters();
      const data = Array.isArray(response) ? response : (response?.centers || []);
      // Filter to verified centers only
      setCenters(data.filter((c: any) => c.verified));
    } catch (err) {
      setError('Failed to load centers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiService.createRoleUpgradeRequest({
        requestedRole: 'CENTER_MANAGER',
        centerId: formData.centerId,
        justification: formData.justification,
      });

      // Success
      alert('Your upgrade request has been submitted! An administrator will review it soon.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Building className="h-6 w-6 text-blue-500" />
            <DialogTitle>Request Center Manager Role</DialogTitle>
          </div>
          <DialogDescription>
            Submit a request to become a center manager. An administrator will review
            your application and assign you to the selected community center.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This request requires administrator approval.
              You will be notified once your request is reviewed.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="centerId">Select Community Center *</Label>
            <Select
              value={formData.centerId}
              onValueChange={(value) => setFormData({ ...formData, centerId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a center" />
              </SelectTrigger>
              <SelectContent>
                {centers.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name} - {center.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Why do you want to manage this center? *</Label>
            <Textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              placeholder="Explain your connection to this center, relevant experience, and how you plan to contribute..."
              rows={6}
              required
              minLength={20}
            />
            <p className="text-sm text-gray-500">Minimum 20 characters</p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.centerId || formData.justification.length < 20}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
