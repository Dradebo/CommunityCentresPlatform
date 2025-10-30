import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { entrepreneurService } from '../../services/entrepreneur';
import { Briefcase, Building, Phone, Mail, Globe, CheckCircle } from 'lucide-react';

interface EntrepreneurRegistrationFormProps {
  userId: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export const EntrepreneurRegistrationForm: React.FC<EntrepreneurRegistrationFormProps> = ({
  userId,
  onComplete,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    phone: '',
    email: '',
    website: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const businessTypes = [
    'Agriculture',
    'Technology',
    'Retail',
    'Services',
    'Manufacturing',
    'Healthcare',
    'Education',
    'Food & Beverage',
    'Arts & Crafts',
    'Construction',
    'Transportation',
    'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!formData.businessType) {
      setError('Please select a business type');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Business description is required');
      return false;
    }
    if (formData.description.trim().length < 20) {
      setError('Description must be at least 20 characters');
      return false;
    }
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Invalid email format');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await entrepreneurService.createEntrepreneurProfile({
        businessName: formData.businessName.trim(),
        businessType: formData.businessType,
        description: formData.description.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined
      });

      setSuccess(true);

      // Auto-complete after showing success message
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create business profile');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold">Business Profile Created!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your business profile has been submitted and is pending verification.
              You'll be able to enroll in community center programs once verified.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Complete Your Business Profile
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us about your business to get started with community center programs
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="pl-10"
                placeholder="Your business or enterprise name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type *</Label>
            <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your business type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Business Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what your business does, products/services offered, and your goals... (minimum 20 characters)"
              rows={4}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.description.length} / 20 characters minimum
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                  placeholder="+256..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  placeholder="contact@business.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="pl-10"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating Profile...' : 'Create Business Profile'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            * Required fields. Your profile will be reviewed by administrators before being verified.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
