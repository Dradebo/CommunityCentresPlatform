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
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2 } from 'lucide-react';
import { entrepreneurService } from '../services/entrepreneur';
import { enrollmentService } from '../services/enrollment';

interface EnrollmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  onSuccess: () => void;
}

import type { Entrepreneur } from '../src/types/entrepreneur';

export function EnrollmentDialog({ isOpen, onClose, hubId, onSuccess }: EnrollmentDialogProps) {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loadingEntrepreneurs, setLoadingEntrepreneurs] = useState(false);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEntrepreneurs();
    }
  }, [isOpen]);

  const loadEntrepreneurs = async () => {
    try {
      setLoadingEntrepreneurs(true);
      setError('');
      const response = await entrepreneurService.listEntrepreneurs();
      setEntrepreneurs(response.entrepreneurs || []);
    } catch (err: any) {
      console.error('Failed to load entrepreneurs:', err);
      setError(err.message || 'Failed to load entrepreneurs');
    } finally {
      setLoadingEntrepreneurs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntrepreneur) {
      setError('Please select an entrepreneur');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await enrollmentService.createEnrollment({
        hubId,
        entrepreneurId: selectedEntrepreneur,
      });

      // Reset form
      setSelectedEntrepreneur('');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create enrollment:', err);
      setError(err.message || 'Failed to enroll entrepreneur');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedEntrepreneur('');
      setError('');
      onClose();
    }
  };

  const selectedEntrepreneurData = entrepreneurs.find(e => e.id === selectedEntrepreneur);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll Entrepreneur</DialogTitle>
          <DialogDescription>
            Enroll an entrepreneur to your hub. Once enrolled, they will be marked as ACTIVE and will have access to your hub's services.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="entrepreneur">
              Select Entrepreneur <span className="text-red-500">*</span>
            </Label>
            {loadingEntrepreneurs ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading entrepreneurs...</span>
              </div>
            ) : entrepreneurs.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No entrepreneurs found. Entrepreneurs need to register first before they can be enrolled.
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
                    <SelectValue placeholder="Select an entrepreneur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {entrepreneurs.map(entrepreneur => (
                      <SelectItem key={entrepreneur.id} value={entrepreneur.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{entrepreneur.businessName}</span>
                          <span className="text-xs text-gray-500">
                            {entrepreneur.businessType}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEntrepreneurData && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p><strong>Business:</strong> {selectedEntrepreneurData.businessName}</p>
                    <p><strong>Type:</strong> {selectedEntrepreneurData.businessType}</p>
                    <p><strong>Description:</strong> {selectedEntrepreneurData.description}</p>
                    {selectedEntrepreneurData.verified && (
                      <p className="text-green-600 dark:text-green-400 mt-1">✓ Verified</p>
                    )}
                  </div>
                )}
              </>
            )}
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
              disabled={loading || entrepreneurs.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                'Enroll Entrepreneur'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
