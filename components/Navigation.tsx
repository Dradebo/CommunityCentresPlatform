import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ThemeToggle } from './ThemeToggle';
import { MapPin, Shield, Plus, Map, MessageSquare, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CENTER_MANAGER' | 'VISITOR';
  verified: boolean;
}

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: 'map' | 'admin' | 'add-center' | 'center-detail' | 'messages') => void;
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
      case 'VISITOR':
        return 'outline';
      default:
        return 'outline';
    }
  };

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

              <Button
                variant="outline"
                onClick={() => setCurrentView('add-center')}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Center</span>
              </Button>
            </div>

            <div className="flex md:hidden items-center space-x-2">
              <Button
                variant={currentView === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('map')}
              >
                <Map className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('add-center')}
              >
                <Plus className="h-4 w-4" />
              </Button>
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
                
                <div className="flex items-center space-x-2">
                  <div className="hidden lg:block text-right">
                    <div className="text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="hidden md:flex">
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