import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Mail, Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CommunityCenterData {
  id: string;
  name: string;
  location: string;
  services: string[];
  verified: boolean;
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

interface ContactCenterFormProps {
  center: CommunityCenterData;
  onSendMessage: (message: Omit<ContactMessage, 'id' | 'timestamp' | 'status'>) => void;
}

const inquiryTypes = [
  'General Information',
  'Service Inquiry',
  'Partnership Opportunity',
  'Volunteer Interest',
  'Complaint/Feedback',
  'Other'
];

export function ContactCenterForm({ center, onSendMessage }: ContactCenterFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    senderName: '',
    senderEmail: '',
    subject: '',
    message: '',
    inquiryType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.senderName || !formData.senderEmail || !formData.subject || !formData.message || !formData.inquiryType) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Send message
      onSendMessage({
        centerName: center.name,
        centerId: center.id,
        senderName: formData.senderName,
        senderEmail: formData.senderEmail,
        subject: formData.subject,
        message: formData.message,
        inquiryType: formData.inquiryType
      });

      // Reset form
      setFormData({
        senderName: '',
        senderEmail: '',
        subject: '',
        message: '',
        inquiryType: ''
      });

      setIsOpen(false);
      toast.success('Message sent successfully! The community center will receive your inquiry.');
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <MessageCircle className="h-4 w-4" />
          <span>Contact Center</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Contact {center.name}</span>
          </DialogTitle>
          <DialogDescription>
            Send a message to {center.name} through our secure platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="senderName">Your Name *</Label>
              <Input
                id="senderName"
                value={formData.senderName}
                onChange={(e) => handleInputChange('senderName', e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <Label htmlFor="senderEmail">Email Address *</Label>
              <Input
                id="senderEmail"
                type="email"
                value={formData.senderEmail}
                onChange={(e) => handleInputChange('senderEmail', e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="inquiryType">Inquiry Type *</Label>
            <Select value={formData.inquiryType} onValueChange={(value) => handleInputChange('inquiryType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select inquiry type" />
              </SelectTrigger>
              <SelectContent>
                {inquiryTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Brief description of your inquiry"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Please provide details about your inquiry..."
              rows={4}
              required
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              <Mail className="h-4 w-4 inline mr-1" />
              Your message will be forwarded to {center.name} securely. They will respond directly to your email address.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}