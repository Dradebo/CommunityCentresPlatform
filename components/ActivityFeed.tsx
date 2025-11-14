import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Pin, Calendar, User, TrendingUp, Briefcase, Link, MessageSquare, PlusCircle } from 'lucide-react';
import activityService, { HubActivity } from '../services/activity';
import { useAuth } from '../contexts/AuthContext';

interface ActivityFeedProps {
  hubId: string;
  isManager: boolean;
  onPostClick: () => void;
}

export function ActivityFeed({ hubId, isManager, onPostClick }: ActivityFeedProps) {
  const [activities, setActivities] = useState<HubActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    loadActivities();
  }, [hubId, page]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await activityService.getHubActivities(hubId, page, 20);
      setActivities(response.activities);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load activities:', err);
      setError(err.message || 'Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (activityId: string, currentPinned: boolean) => {
    if (!isManager) return;

    try {
      await activityService.pinActivity(activityId, !currentPinned);
      await loadActivities(); // Refresh feed
    } catch (err: any) {
      setError(err.message || 'Failed to update pin status');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ENROLLMENT':
        return <Briefcase className="h-5 w-5" />;
      case 'SERVICE':
        return <TrendingUp className="h-5 w-5" />;
      case 'COLLABORATION':
        return <Link className="h-5 w-5" />;
      case 'ANNOUNCEMENT':
        return <MessageSquare className="h-5 w-5" />;
      case 'CONNECTION':
        return <Link className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string) => {
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
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Hub Activity Feed</span>
            {isManager && (
              <Button onClick={onPostClick} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Post Update
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Hub Activity Feed</span>
          {isManager && (
            <Button onClick={onPostClick} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Post Update
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No activities yet</p>
            <p className="text-sm">
              {isManager
                ? 'Share updates about entrepreneurs, services, and collaborations'
                : 'Check back later for updates from this hub'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => (
              <div
                key={activity.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md dark:border-gray-700 ${
                  activity.pinned ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{activity.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <User className="h-3 w-3" />
                        <span>{activity.creatorName}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activity.pinned && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Pin className="h-3 w-3" />
                        <span>Pinned</span>
                      </Badge>
                    )}
                    {isManager && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePin(activity.id, activity.pinned)}
                        title={activity.pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className={`h-4 w-4 ${activity.pinned ? 'fill-current' : ''}`} />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                  {activity.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {activity.type.toLowerCase().replace('_', ' ')}
                  </Badge>
                  {activity.entrepreneurName && (
                    <Badge variant="secondary">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {activity.entrepreneurName}
                    </Badge>
                  )}
                  {activity.collaboratingHubName && (
                    <Badge variant="secondary">
                      <Link className="h-3 w-3 mr-1" />
                      {activity.collaboratingHubName}
                    </Badge>
                  )}
                  {activity.serviceType && (
                    <Badge variant="secondary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {activity.serviceType}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
