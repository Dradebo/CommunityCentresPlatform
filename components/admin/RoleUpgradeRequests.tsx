import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, XCircle, Clock, User, Building, FileText } from 'lucide-react';
import { apiService } from '../../services/api';

export const RoleUpgradeRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await apiService.getRoleUpgradeRequests('PENDING');
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, action: 'approve' | 'reject') => {
    setReviewing(true);
    try {
      await apiService.reviewRoleUpgradeRequest(requestId, {
        action,
        notes: reviewNotes || undefined,
      });

      // Reload requests
      await loadRequests();
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to review request');
    } finally {
      setReviewing(false);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Role Upgrade Requests ({requests.length} pending)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : requests.length === 0 ? (
            <Alert>
              <AlertDescription>No pending requests</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-semibold">{request.user?.name}</p>
                            <p className="text-sm text-gray-600">{request.user?.email}</p>
                          </div>
                          <Badge className={statusColors[request.status]}>
                            {request.status}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-3 text-sm">
                          <span className="text-gray-600">Role Upgrade:</span>
                          <Badge variant="outline">{request.currentRole}</Badge>
                          <span>→</span>
                          <Badge variant="outline">{request.requestedRole}</Badge>
                        </div>

                        {request.center && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{request.center.name}</span>
                            <span className="text-gray-600">- {request.center.location}</span>
                          </div>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1 flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            Justification:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {request.justification}
                          </p>
                        </div>

                        <p className="text-xs text-gray-500">
                          Submitted {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="ml-4 space-y-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          className="w-full"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Upgrade Request</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 pt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                <p><strong>User:</strong> {selectedRequest.user?.name}</p>
                <p><strong>Email:</strong> {selectedRequest.user?.email}</p>
                <p><strong>Upgrade:</strong> {selectedRequest.currentRole} → {selectedRequest.requestedRole}</p>
                {selectedRequest.center && (
                  <p><strong>Center:</strong> {selectedRequest.center.name}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-semibold mb-2">Justification:</Label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {selectedRequest.justification}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  disabled={reviewing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview(selectedRequest.id, 'reject')}
                  disabled={reviewing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview(selectedRequest.id, 'approve')}
                  disabled={reviewing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
