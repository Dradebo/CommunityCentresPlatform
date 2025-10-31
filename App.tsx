import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleMap } from './components/GoogleMap';
import { AdminDashboard } from './components/AdminDashboard';
import { CommunityCenter } from './components/CommunityCenter';
import { AddCenterForm } from './components/AddCenterForm';
import { Navigation } from './components/Navigation';
import { SearchAndFilter } from './components/SearchAndFilter';
import { CenterMessaging } from './components/CenterMessaging';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { EntrepreneurRegistrationForm } from './components/entrepreneur/EntrepreneurRegistrationForm';
import { EntrepreneurDashboard } from './components/entrepreneur/EntrepreneurDashboard';
import { EntrepreneurProfile } from './components/entrepreneur/EntrepreneurProfile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { MapPin, Users, Building, CheckCircle, Filter, Loader2 } from 'lucide-react';
import { apiService } from './services/api';
import { eventsService } from './services/events';
import { Toaster, toast } from 'sonner';
import { EmptyState } from './components/EmptyState';
import { CenterCard } from './components/CenterCard';
import { MapSkeleton } from './components/skeletons/MapSkeleton';
import { CenterCardSkeletonGrid } from './components/skeletons/CenterCardSkeleton';
import { StatCardSkeletonRow } from './components/skeletons/StatCardSkeleton';

interface CommunityCenterData {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  services: string[];
  description: string;
  verified: boolean;
  connections: string[];
  addedBy: 'admin' | 'visitor';
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

interface FilterCriteria {
  searchQuery: string;
  selectedServices: string[];
  selectedLocations: string[];
  verificationStatus: 'all' | 'verified' | 'unverified';
  connectionStatus: 'all' | 'connected' | 'standalone';
  addedBy: 'all' | 'admin' | 'visitor';
}

interface ContactMessage {
  id: string;
  centerName: string;
  centerId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  inquiryType: string;
  timestamp: Date;
  status: 'pending' | 'forwarded';
}

interface CenterMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface MessageThread {
  id: string;
  participants: string[];
  participantNames: string[];
  subject: string;
  lastMessage?: CenterMessage;
  lastActivity: Date;
  messageCount: number;
}

function AppContent() {
  const { user, loading: authLoading, isAdmin, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<'map' | 'admin' | 'add-center' | 'center-detail' | 'messages' | 'entrepreneur-dashboard' | 'entrepreneur-profile' | 'entrepreneur-register'>('map');
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [filteredCenters, setFilteredCenters] = useState<CommunityCenterData[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria>({
    searchQuery: '',
    selectedServices: [],
    selectedLocations: [],
    verificationStatus: 'all',
    connectionStatus: 'all',
    addedBy: 'all'
  });
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [centerMessages, setCenterMessages] = useState<CenterMessage[]>([]);
  const [communityCenters, setCommunityCenters] = useState<CommunityCenterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Load centers for everyone (public access), admin data only for authenticated users
  useEffect(() => {
    // Load centers for all users (no authentication required)
    loadCenters();

    // Only load admin-specific data if authenticated
    if (isAuthenticated) {
      loadContactMessages();
    }
  }, [isAuthenticated]);

  const loadCenters = async (filters?: any) => {
    try {
      setLoading(true);
      const response = await apiService.getCenters(filters);
      setCommunityCenters(response.centers);
      setFilteredCenters(response.centers);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load centers';
      toast.error('Loading Failed', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => loadCenters(filters),
        },
      });
      console.error('Error loading centers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadContactMessages = async () => {
    try {
      if (isAdmin) {
        const response = await apiService.getContactMessages();
        setContactMessages(response.messages);
      }
    } catch (err: any) {
      console.error('Error loading contact messages:', err);
    }
  };

  // SSE event listeners
  useEffect(() => {
    const setup = async () => {
      if (!isAuthenticated) return;
      if (!eventsService.isConnected()) {
        await eventsService.connect();
      }
      eventsService.onCenterUpdate(() => { loadCenters(activeFilters); });
      // If you emit contact messages via SSE, wire here:
      // eventsService.onNewMessage((message) => setContactMessages(prev => [...prev, message]));
      return () => {
        eventsService.offCenterUpdate();
        // eventsService.offNewMessage();
      };
    };
    const p = setup();
    return () => { void p; };
  }, [isAuthenticated, activeFilters]);

  // Initialize filtered centers
  useEffect(() => {
    setFilteredCenters(communityCenters);
  }, [communityCenters]);

  const handleAddCenter = async (centerData: Omit<CommunityCenterData, 'id' | 'verified' | 'connections'>) => {
    try {
      await apiService.createCenter({
        name: centerData.name,
        location: centerData.location,
        latitude: centerData.coordinates.lat,
        longitude: centerData.coordinates.lng,
        services: centerData.services,
        description: centerData.description,
        phone: centerData.contactInfo.phone,
        email: centerData.contactInfo.email,
        website: centerData.contactInfo.website
      });
      toast.success('Center Created', {
        description: `${centerData.name} has been added to the network`,
      });
      // Refresh centers list
      await loadCenters(activeFilters);
      setCurrentView('map');
    } catch (err: any) {
      toast.error('Failed to Create Center', {
        description: err.message || 'Unable to create center. Please try again.',
      });
    }
  };

  const handleVerifyCenter = async (centerId: string) => {
    try {
      await apiService.verifyCenter(centerId);
      toast.success('Center Verified', {
        description: 'The center has been successfully verified',
      });
      // Refresh centers list
      await loadCenters(activeFilters);
      await loadContactMessages();
    } catch (err: any) {
      toast.error('Verification Failed', {
        description: err.message || 'Unable to verify center',
      });
    }
  };

  const handleConnectCenters = async (center1Id: string, center2Id: string) => {
    try {
      await apiService.connectCenters(center1Id, center2Id);
      toast.success('Centers Connected', {
        description: 'The centers have been successfully connected',
      });
      // Refresh centers list
      await loadCenters(activeFilters);
    } catch (err: any) {
      toast.error('Connection Failed', {
        description: err.message || 'Unable to connect centers',
      });
    }
  };

  const handleFilterChange = async (filtered: CommunityCenterData[], filters: FilterCriteria) => {
    setActiveFilters(filters);
    // Load centers with API filters
    await loadCenters({
      searchQuery: filters.searchQuery,
      services: filters.selectedServices,
      locations: filters.selectedLocations,
      verificationStatus: filters.verificationStatus,
      connectionStatus: filters.connectionStatus,
      addedBy: filters.addedBy
    });
  };

  const handleSendContactMessage = async (messageData: Omit<ContactMessage, 'id' | 'timestamp' | 'status'>) => {
    try {
      await apiService.sendContactMessage({
        centerId: messageData.centerId,
        subject: messageData.subject,
        message: messageData.message,
        inquiryType: messageData.inquiryType
      });
      toast.success('Message Sent', {
        description: 'Your message has been sent successfully',
      });
      // Refresh contact messages if admin
      if (isAdmin) {
        await loadContactMessages();
      }
    } catch (err: any) {
      toast.error('Failed to Send Message', {
        description: err.message || 'Unable to send your message. Please try again.',
      });
    }
  };

  const handleSendCenterMessage = async (threadId: string, content: string) => {
    try {
      await apiService.sendThreadMessage(threadId, content);
      toast.success('Message Sent', {
        description: 'Your message has been delivered',
      });
      // Reload messages for this thread
      if (selectedCenter) {
        const response = await apiService.getMessageThreads(selectedCenter);
        setMessageThreads(response.threads);
        // Also reload messages for the thread
        const messagesResponse = await apiService.getThreadMessages(threadId);
        setCenterMessages(messagesResponse.messages);
      }
    } catch (err: any) {
      toast.error('Failed to Send Message', {
        description: err.message || 'Unable to send message',
      });
    }
  };

  const handleCreateMessageThread = async (participantIds: string[], subject: string, initialMessage: string) => {
    try {
      await apiService.createMessageThread({
        participantIds,
        subject,
        initialMessage
      });
      toast.success('Thread Created', {
        description: 'New message thread has been created successfully',
      });
      // Reload threads
      if (selectedCenter) {
        const response = await apiService.getMessageThreads(selectedCenter);
        setMessageThreads(response.threads);
      }
    } catch (err: any) {
      toast.error('Failed to Create Thread', {
        description: err.message || 'Unable to create message thread',
      });
    }
  };

  const verifiedCenters = communityCenters.filter(center => center.verified);
  const unverifiedCenters = communityCenters.filter(center => !center.verified);
  
  // Use filtered centers for display, fall back to all centers if no filters applied
  const centersToDisplay = filteredCenters.length > 0 || Object.values(activeFilters).some(f => 
    Array.isArray(f) ? f.length > 0 : f !== 'all' && f !== ''
  ) ? filteredCenters : communityCenters;

  const handleAuthRequired = (action?: () => void) => {
    setShowAuthDialog(true);
    setAuthMode('login');
    return action;
  };

  // Show loading spinner during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 dark:text-primary-400 mx-auto" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">Loading Community Centers...</p>
        </div>
      </div>
    );
  }

  // Main app - PUBLIC ACCESS (no auth wall)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast Notifications */}
      <Toaster position="top-right" richColors closeButton expand={false} />

      {/* Auth Modal Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </DialogTitle>
          </DialogHeader>
          {authMode === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setAuthMode('register')}
              onClose={() => setShowAuthDialog(false)}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setAuthMode('login')}
              onClose={() => setShowAuthDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Navigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onAuthRequired={handleAuthRequired}
      />
      
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {currentView === 'map' && (
          <div>
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4">Kampala Community Centers Network</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Total Centers</CardTitle>
                    <Building className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl">{communityCenters.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Showing</CardTitle>
                    <Filter className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl">{centersToDisplay.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Verified Centers</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl">{verifiedCenters.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Total Connections</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl">
                      {communityCenters.reduce((total, center) => total + center.connections.length, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <SearchAndFilter 
              centers={communityCenters}
              onFilterChange={handleFilterChange}
            />
            
            {loading ? (
              <MapSkeleton />
            ) : (
              <GoogleMap
                centers={centersToDisplay.map(center => ({
                  ...center,
                  latitude: center.coordinates.lat,
                  longitude: center.coordinates.lng
                }))}
                selectedCenter={selectedCenter}
                onCenterSelect={(centerId) => {
                  setSelectedCenter(centerId);
                  setCurrentView('center-detail');
                }}
                className="h-[400px] md:h-[500px] rounded-lg"
              />
            )}
            
            <div className="mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Community Centers Directory</h2>
                {centersToDisplay.length !== communityCenters.length && (
                  <Badge variant="outline">
                    Showing {centersToDisplay.length} of {communityCenters.length} centers
                  </Badge>
                )}
              </div>
              {loading ? (
                <CenterCardSkeletonGrid count={6} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                  {centersToDisplay.map(center => (
                    <CenterCard
                      key={center.id}
                      center={center}
                      onClick={() => {
                        setSelectedCenter(center.id);
                        setCurrentView('center-detail');
                      }}
                    />
                  ))}
                </div>
              )}
              {centersToDisplay.length === 0 && (
                <EmptyState
                  icon={Filter}
                  title="No centers found"
                  description="Try adjusting your search criteria or filters to find community centers."
                  action={{
                    label: 'Clear Filters',
                    onClick: () => handleFilterChange([], {
                      searchQuery: '',
                      selectedServices: [],
                      selectedLocations: [],
                      verificationStatus: 'all',
                      connectionStatus: 'all',
                      addedBy: 'all'
                    })
                  }}
                />
              )}
            </div>
          </div>
        )}

        {currentView === 'admin' && (
          <div>
            <SearchAndFilter 
              centers={communityCenters}
              onFilterChange={handleFilterChange}
            />
            <AdminDashboard 
              centers={centersToDisplay.length > 0 ? centersToDisplay : communityCenters}
              unverifiedCenters={unverifiedCenters}
              contactMessages={contactMessages}
              onVerifyCenter={handleVerifyCenter}
              onConnectCenters={handleConnectCenters}
            />
          </div>
        )}

        {currentView === 'add-center' && (
          <AddCenterForm 
            onAddCenter={handleAddCenter}
            isAdmin={isAdmin}
          />
        )}

        {currentView === 'center-detail' && selectedCenter && (
          <CommunityCenter
            center={communityCenters.find(c => c.id === selectedCenter)!}
            allCenters={communityCenters}
            onConnectCenter={handleConnectCenters}
            onSendContactMessage={handleSendContactMessage}
            onBackToMap={() => {
              setCurrentView('map');
              setSelectedCenter(null);
            }}
            isAdmin={isAdmin}
          />
        )}

        {currentView === 'messages' && isAdmin && (
          <div>
            <div className="mb-6">
              <h1>Center Communications</h1>
              <p className="text-gray-600">Communicate with other verified community centers</p>
            </div>
            {/* Select a verified center for messaging */}
            {!selectedCenter && (
              <div className="mb-6">
                <label className="block text-sm mb-2">Select a verified center to manage messages for:</label>
                <select
                  className="border rounded-md px-3 py-2"
                  onChange={(e) => setSelectedCenter(e.target.value)}
                >
                  <option value="">Choose a center...</option>
                  {verifiedCenters.map(center => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCenter && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2>Messaging as: {communityCenters.find(c => c.id === selectedCenter)?.name}</h2>
                  <Button variant="outline" onClick={() => setSelectedCenter(null)}>
                    Switch Center
                  </Button>
                </div>
                <CenterMessaging
                  currentCenter={communityCenters.find(c => c.id === selectedCenter)!}
                  allCenters={communityCenters}
                  messageThreads={messageThreads}
                  messages={centerMessages}
                  onSendMessage={handleSendCenterMessage}
                  onCreateThread={handleCreateMessageThread}
                />
              </div>
            )}
          </div>
        )}

        {currentView === 'entrepreneur-dashboard' && user && user.role === 'ENTREPRENEUR' && (
          <EntrepreneurDashboard userId={user.id} />
        )}

        {currentView === 'entrepreneur-profile' && user && user.role === 'ENTREPRENEUR' && (
          <div>
            <Button
              variant="outline"
              onClick={() => setCurrentView('entrepreneur-dashboard')}
              className="mb-4"
            >
              ← Back to Dashboard
            </Button>
            <EntrepreneurProfile entrepreneurId={user.id} />
          </div>
        )}

        {currentView === 'entrepreneur-register' && user && user.role === 'ENTREPRENEUR' && (
          <EntrepreneurRegistrationForm
            userId={user.id}
            onComplete={() => setCurrentView('entrepreneur-dashboard')}
            onCancel={() => setCurrentView('map')}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;