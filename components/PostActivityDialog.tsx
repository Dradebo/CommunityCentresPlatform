import React, { useState } from 'react';
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
import activityService, { CreateActivityRequest } from '../services/activity';

interface PostActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  onSuccess: () => void;
}

const activityTypes = [
  { value: 'ENROLLMENT', label: 'Entrepreneur Enrollment', description: 'New entrepreneur joined or graduated from a program' },
  { value: 'SERVICE', label: 'Service Delivery', description: 'Service provided to an entrepreneur' },
  { value: 'COLLABORATION', label: 'Hub Collaboration', description: 'Partnership or collaboration with another hub' },
  { value: 'ANNOUNCEMENT', label: 'General Announcement', description: 'News, events, or updates about the hub' },
  { value: 'CONNECTION', label: 'New Connection', description: 'New partnership or network connection formed' },
];

export function PostActivityDialog({ isOpen, onClose, hubId, onSuccess }: PostActivityDialogProps) {
  const [formData, setFormData] = useState<CreateActivityRequest>({
    hubId,
    type: 'ANNOUNCEMENT',
    title: '',
    description: '',
    pinned: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await activityService.createActivity(formData);

      // Reset form
      setFormData({
        hubId,
        type: 'ANNOUNCEMENT',
        title: '',
        description: '',
        pinned: false,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create activity:', err);
      setError(err.message || 'Failed to post activity');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        hubId,
        type: 'ANNOUNCEMENT',
        title: '',
        description: '',
        pinned: false,
      });
      setError('');
      onClose();
    }
  };

  const selectedType = activityTypes.find(t => t.value === formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Post Hub Activity</DialogTitle>
          <DialogDescription>
            Share updates about entrepreneurs, services, collaborations, and announcements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Activity Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedType.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="E.g., New entrepreneur graduated from skills training program"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              disabled={loading}
              maxLength={255}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formData.title.length}/255 characters (min 5)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide details about this activity..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formData.description.length} characters (min 10)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="pinned"
              checked={formData.pinned}
              onChange={e => setFormData({ ...formData, pinned: e.target.checked })}
              disabled={loading}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="pinned" className="font-normal cursor-pointer">
              Pin this activity to the top of the feed
            </Label>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Activity'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
