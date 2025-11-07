import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { User, Mail, Shield, Calendar, ArrowUpCircle, Building } from 'lucide-react';
import { EntrepreneurUpgradeDialog } from './EntrepreneurUpgradeDialog';
import { CenterManagerUpgradeDialog } from './CenterManagerUpgradeDialog';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [showEntrepreneurDialog, setShowEntrepreneurDialog] = useState(false);
  const [showCenterManagerDialog, setShowCenterManagerDialog] = useState(false);

  if (!user) return null;

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-500',
    CENTER_MANAGER: 'bg-blue-500',
    ENTREPRENEUR: 'bg-purple-500',
    VISITOR: 'bg-gray-500',
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator',
    CENTER_MANAGER: 'Center Manager',
    ENTREPRENEUR: 'Entrepreneur',
    VISITOR: 'Visitor',
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture & Basic Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.pictureUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <Badge className={`mt-2 ${roleColors[user.role]}`}>
                {roleLabels[user.role]}
              </Badge>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center space-x-3 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">User ID:</span>
              <span className="font-mono text-xs">{user.id}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Auth Provider:</span>
              <span>{user.authProvider || 'EMAIL'}</span>
            </div>
            {user.createdAt && (
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Role Upgrade Button - ONLY for VISITOR */}
          {user.role === 'VISITOR' && (
            <div className="pt-4 border-t">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <ArrowUpCircle className="h-5 w-5 mr-2 text-blue-500" />
                  Upgrade to Entrepreneur
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Register your business profile to access enrollment opportunities,
                  connect with community centers, and track services.
                </p>
                <Button onClick={() => setShowEntrepreneurDialog(true)} className="w-full">
                  Become an Entrepreneur
                </Button>
              </div>
            </div>
          )}

          {/* Role Upgrade Button - ONLY for ENTREPRENEUR */}
          {user.role === 'ENTREPRENEUR' && (
            <div className="pt-4 border-t">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-500" />
                  Become a Center Manager
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Manage a community center, enroll entrepreneurs, track services, and build collaborations.
                  This requires administrator approval.
                </p>
                <Button onClick={() => setShowCenterManagerDialog(true)} className="w-full">
                  Request Center Manager Role
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EntrepreneurUpgradeDialog
        isOpen={showEntrepreneurDialog}
        onClose={() => setShowEntrepreneurDialog(false)}
      />

      <CenterManagerUpgradeDialog
        isOpen={showCenterManagerDialog}
        onClose={() => setShowCenterManagerDialog(false)}
      />
    </div>
  );
};
