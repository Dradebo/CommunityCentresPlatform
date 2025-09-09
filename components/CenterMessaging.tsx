import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Users, 
  Clock,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface CommunityCenterData {
  id: string;
  name: string;
  location: string;
  services: string[];
  verified: boolean;
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

interface CenterMessagingProps {
  currentCenter: CommunityCenterData;
  allCenters: CommunityCenterData[];
  messageThreads: MessageThread[];
  messages: CenterMessage[];
  onSendMessage: (threadId: string, content: string) => void;
  onCreateThread: (participantIds: string[], subject: string, initialMessage: string) => void;
}

export function CenterMessaging({ 
  currentCenter, 
  allCenters, 
  messageThreads, 
  messages,
  onSendMessage,
  onCreateThread 
}: CenterMessagingProps) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadData, setNewThreadData] = useState({
    participants: [] as string[],
    subject: '',
    message: ''
  });

  // Filter threads that include current center
  const currentCenterThreads = messageThreads.filter(thread => 
    thread.participants.includes(currentCenter.id)
  );

  // Get verified centers excluding current center
  const availableCenters = allCenters.filter(center => 
    center.verified && center.id !== currentCenter.id
  );

  // Get messages for selected thread
  const threadMessages = selectedThread 
    ? messages.filter(msg => msg.threadId === selectedThread)
    : [];

  const selectedThreadData = messageThreads.find(thread => thread.id === selectedThread);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !newMessage.trim()) return;

    onSendMessage(selectedThread, newMessage.trim());
    setNewMessage('');
    toast.success('Message sent!');
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadData.participants.length || !newThreadData.subject || !newThreadData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    onCreateThread(
      [...newThreadData.participants, currentCenter.id],
      newThreadData.subject,
      newThreadData.message
    );

    setNewThreadData({ participants: [], subject: '', message: '' });
    setShowNewThread(false);
    toast.success('Conversation started!');
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Center Communications</span>
          </CardTitle>
          <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Conversation</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
                <DialogDescription>
                  Select verified community centers to include in this conversation.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateThread} className="space-y-4">
                <div>
                  <Label>Select Centers to Include</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto">
                    {availableCenters.map(center => (
                      <div key={center.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={center.id}
                          checked={newThreadData.participants.includes(center.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewThreadData(prev => ({
                                ...prev,
                                participants: [...prev.participants, center.id]
                              }));
                            } else {
                              setNewThreadData(prev => ({
                                ...prev,
                                participants: prev.participants.filter(id => id !== center.id)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={center.id} className="text-sm cursor-pointer">
                          {center.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newThreadData.subject}
                    onChange={(e) => setNewThreadData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Conversation topic"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Initial Message</Label>
                  <Textarea
                    id="message"
                    value={newThreadData.message}
                    onChange={(e) => setNewThreadData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Start the conversation..."
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => setShowNewThread(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Start Conversation
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex">
        {/* Thread List */}
        <div className="w-1/3 border-r pr-4">
          <ScrollArea className="h-full">
            {currentCenterThreads.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentCenterThreads.map(thread => (
                  <Card 
                    key={thread.id}
                    className={`cursor-pointer transition-colors ${
                      selectedThread === thread.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedThread(thread.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm truncate">{thread.subject}</p>
                        <Badge variant="secondary" className="text-xs">
                          {thread.messageCount}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {thread.participantNames.filter(name => name !== currentCenter.name).join(', ')}
                      </p>
                      {thread.lastMessage && (
                        <p className="text-xs text-gray-600 truncate">
                          {thread.lastMessage.content}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(thread.lastActivity)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message View */}
        <div className="flex-1 pl-4 flex flex-col">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="pb-4">
                <h3 className="font-medium">{selectedThreadData?.subject}</h3>
                <p className="text-sm text-gray-500">
                  with {selectedThreadData?.participantNames.filter(name => name !== currentCenter.name).join(', ')}
                </p>
              </div>
              
              {/* Messages */}
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {threadMessages.map(message => (
                    <div 
                      key={message.id}
                      className={`flex ${message.senderId === currentCenter.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${
                        message.senderId === currentCenter.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100'
                      } rounded-lg p-3`}>
                        {message.senderId !== currentCenter.id && (
                          <p className="text-xs opacity-75 mb-1">{message.senderName}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === currentCenter.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Send Message */}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}