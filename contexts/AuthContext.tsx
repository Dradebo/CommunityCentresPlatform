import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { eventsService } from '../services/events';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CENTER_MANAGER' | 'VISITOR' | 'ENTREPRENEUR';
  verified: boolean;
  pictureUrl?: string;
  authProvider?: string;
  createdAt: string;  // Required - always sent from backend
  updatedAt: string;  // Required - always sent from backend
  isNewAccount?: boolean;  // Indicates if this is a newly created account
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<any>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    role?: 'VISITOR' | 'CENTER_MANAGER' | 'ENTREPRENEUR';
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCenterManager: boolean;
  isEntrepreneur: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const response = await apiService.getCurrentUser();
        setUser(response.user);
        
        // Connect to SSE stream
        const token = localStorage.getItem('auth_token');
        if (token) {
          await eventsService.connect();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      apiService.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      setUser(response.user);
      
      // Connect to SSE stream
      const token = localStorage.getItem('auth_token');
      if (token) {
        await eventsService.connect();
      }
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await apiService.loginWithGoogle(credential);
      setUser(response.user);

      // Connect to SSE stream
      const token = localStorage.getItem('auth_token');
      if (token) {
        await eventsService.connect();
      }

      // Return response for caller to check user details
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    role?: 'VISITOR' | 'CENTER_MANAGER' | 'ENTREPRENEUR';
  }) => {
    try {
      const response = await apiService.register(userData);
      setUser(response.user);

      // Connect to SSE stream
      const token = localStorage.getItem('auth_token');
      if (token) {
        await eventsService.connect();
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    eventsService.disconnect();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Re-fetch user data by validating the token
      await checkAuthStatus();
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isCenterManager: user?.role === 'CENTER_MANAGER' || user?.role === 'ADMIN',
    isEntrepreneur: user?.role === 'ENTREPRENEUR'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};