import React, { useState, useEffect } from 'react';
import { MapComponent } from './components/MapComponent';
import { AdminDashboard } from './components/AdminDashboard';
import { CommunityCenter } from './components/CommunityCenter';
import { AddCenterForm } from './components/AddCenterForm';
import { Navigation } from './components/Navigation';
import { SearchAndFilter } from './components/SearchAndFilter';
import { CenterMessaging } from './components/CenterMessaging';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Alert, AlertDescription } from './components/ui/alert';
import { MapPin, Users, Building, CheckCircle, Filter, Loader2 } from 'lucide-react';
import { apiService } from './services/api';
import { socketService } from './services/socket';

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
  const [currentView, setCurrentView] = useState<'map' | 'admin' | 'add-center' | 'center-detail' | 'messages'>('map');
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
  const [error, setError] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Replace the hardcoded centers with dynamic loading
  useEffect(() => {
    if (isAuthenticated) {
      loadCenters();
      loadContactMessages();
    }
  }, [isAuthenticated]);

  const loadCenters = async (filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCenters(filters);
      setCommunityCenters(response.centers);
      setFilteredCenters(response.centers);
    } catch (err: any) {
      setError(err.message || 'Failed to load centers');
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

  // Socket.io event listeners
  useEffect(() => {
    if (isAuthenticated && socketService.isConnected()) {
      // Listen for real-time updates
      socketService.onNewContactMessage((message) => {
        setContactMessages(prev => [...prev, message]);
      });

      socketService.onCenterUpdate((update) => {
        loadCenters(activeFilters);
      });

      return () => {
        socketService.offNewContactMessage();
        socketService.offCenterUpdate();
      };
    }
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
      // Refresh centers list
      await loadCenters(activeFilters);
    } catch (err: any) {
      setError(err.message || 'Failed to add center');
    }
  };

  const handleVerifyCenter = async (centerId: string) => {
    try {
      await apiService.verifyCenter(centerId);
      // Refresh centers list
      await loadCenters(activeFilters);
      await loadContactMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to verify center');
    }
  };

  const handleConnectCenters = async (center1Id: string, center2Id: string) => {
    try {
      await apiService.connectCenters(center1Id, center2Id);
      // Refresh centers list
      await loadCenters(activeFilters);
    } catch (err: any) {
      setError(err.message || 'Failed to connect centers');
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
      // Refresh contact messages if admin
      if (isAdmin) {
        await loadContactMessages();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const handleSendCenterMessage = async (threadId: string, content: string) => {
    try {
      await apiService.sendThreadMessage(threadId, content);
      // Reload messages for this thread
      if (selectedCenter) {
        const response = await apiService.getMessageThreads(selectedCenter);
        setMessageThreads(response.threads);
        // Also reload messages for the thread
        const messagesResponse = await apiService.getThreadMessages(threadId);
        setCenterMessages(messagesResponse.messages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const handleCreateMessageThread = async (participantIds: string[], subject: string, initialMessage: string) => {
    try {
      await apiService.createMessageThread({
        participantIds,
        subject,
        initialMessage
      });
      // Reload threads
      if (selectedCenter) {
        const response = await apiService.getMessageThreads(selectedCenter);
        setMessageThreads(response.threads);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create message thread');
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

  // Show loading spinner during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication dialog for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-2xl mb-2">Kampala Community Centers Network</h1>
            <p className="text-gray-600">Connect with community centers across Kampala</p>
          </div>
          {authMode === 'login' ? (
            <LoginForm 
              onSwitchToRegister={() => setAuthMode('register')}
            />
          ) : (
            <RegisterForm 
              onSwitchToLogin={() => setAuthMode('login')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onAuthRequired={handleAuthRequired}
      />
      
      {error && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-2"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'map' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl mb-4">Kampala Community Centers Network</h1>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading community centers...</p>
              </div>
            ) : (
              <MapComponent 
                centers={centersToDisplay}
                onCenterSelect={(centerId) => {
                  setSelectedCenter(centerId);
                  setCurrentView('center-detail');
                }}
              />
            )}
            
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl">Community Centers Directory</h2>
                {centersToDisplay.length !== communityCenters.length && (
                  <Badge variant="outline">
                    Showing {centersToDisplay.length} of {communityCenters.length} centers
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {centersToDisplay.map(center => (
                  <Card key={center.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedCenter(center.id);
                          setCurrentView('center-detail');
                        }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{center.name}</CardTitle>
                        {center.verified && <Badge variant="default">Verified</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {center.location}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-3">{center.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {center.services.slice(0, 3).map(service => (
                          <Badge key={service} variant="secondary">{service}</Badge>
                        ))}
                        {center.services.length > 3 && (
                          <Badge variant="outline">+{center.services.length - 3} more</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {centersToDisplay.length === 0 && (
                <div className="text-center py-12">
                  <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg mb-2">No centers found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
                </div>
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
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;