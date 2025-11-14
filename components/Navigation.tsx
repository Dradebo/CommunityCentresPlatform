import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ThemeToggle } from './ThemeToggle';
import { MapPin, Shield, Plus, Map, MessageSquare, User, LogOut, Briefcase, LayoutDashboard, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CENTER_MANAGER' | 'VISITOR' | 'ENTREPRENEUR';
  verified: boolean;
}

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: 'map' | 'admin' | 'add-center' | 'center-detail' | 'messages' | 'entrepreneur-dashboard' | 'entrepreneur-profile' | 'entrepreneur-register' | 'profile' | 'admin-requests' | 'hub-dashboard') => void;
  user: User | null;
  onAuthRequired: () => void;
}

export function Navigation({ currentView, setCurrentView, user, onAuthRequired }: NavigationProps) {
  const { logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    setCurrentView('map');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'CENTER_MANAGER':
        return 'Center Manager';
      case 'VISITOR':
        return 'Visitor';
      case 'ENTREPRENEUR':
        return 'Entrepreneur';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'default';
      case 'CENTER_MANAGER':
        return 'secondary';
      case 'ENTREPRENEUR':
        return 'default';
      case 'VISITOR':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const isEntrepreneur = user?.role === 'ENTREPRENEUR';
  const isCenterManager = user?.role === 'CENTER_MANAGER';
  const canAddCenter = user?.role === 'ADMIN' || user?.role === 'CENTER_MANAGER';

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-semibold dark:text-white">Kampala Centers</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant={currentView === 'map' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('map')}
                className="flex items-center space-x-2"
              >
                <Map className="h-4 w-4" />
                <span>Map View</span>
              </Button>

              {canAddCenter && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentView('add-center')}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Center</span>
                </Button>
              )}
            </div>

            <div className="flex md:hidden items-center space-x-2">
              <Button
                variant={currentView === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('map')}
                aria-label="Map View"
                title="Map View"
              >
                <Map className="h-4 w-4" />
              </Button>

              {canAddCenter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('add-center')}
                  aria-label="Add Center"
                  title="Add Center"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            <ThemeToggle />

            {user ? (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <>
                    <Button
                      variant={currentView === 'admin' ? 'default' : 'ghost'}
                      onClick={() => setCurrentView('admin')}
                      className="flex items-center space-x-2"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="hidden md:inline">Admin Dashboard</span>
                    </Button>
                    <Button
                      variant={currentView === 'messages' ? 'default' : 'ghost'}
                      onClick={() => setCurrentView('messages')}
                      className="flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden md:inline">Messages</span>
                    </Button>
                  </>
                )}

                {isEntrepreneur && (
                  <Button
                    variant={currentView === 'entrepreneur-dashboard' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('entrepreneur-dashboard')}
                    className="flex items-center space-x-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden md:inline">Dashboard</span>
                  </Button>
                )}

                {isCenterManager && (
                  <Button
                    variant={currentView === 'hub-dashboard' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('hub-dashboard')}
                    className="flex items-center space-x-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden md:inline">Hub Dashboard</span>
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    variant={currentView === 'admin-requests' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('admin-requests')}
                    className="flex items-center space-x-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden lg:inline">Upgrade Requests</span>
                  </Button>
                )}

                <Button
                  variant={currentView === 'profile' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('profile')}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">Profile</span>
                </Button>

                <div className="flex items-center space-x-2">
                  <div className="hidden lg:block text-right">
                    <div className="text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="hidden md:flex">
                    {isEntrepreneur && <Briefcase className="h-3 w-3 mr-1" />}
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Logout</span>
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={onAuthRequired} className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}