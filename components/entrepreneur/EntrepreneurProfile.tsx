import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { entrepreneurService } from '../../services/entrepreneur';
import { Entrepreneur } from '../../src/types/entrepreneur';
import { Briefcase, Building, Phone, Mail, Globe, Edit2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';

interface EntrepreneurProfileProps {
  entrepreneurId: string;
}

export const EntrepreneurProfile: React.FC<EntrepreneurProfileProps> = ({ entrepreneurId }) => {
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    phone: '',
    email: '',
    website: ''
  });

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

  useEffect(() => {
    loadProfile();
  }, [entrepreneurId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { entrepreneur } = await entrepreneurService.getEntrepreneur(entrepreneurId);
      setEntrepreneur(entrepreneur);
      setFormData({
        businessName: entrepreneur.businessName,
        businessType: entrepreneur.businessType,
        description: entrepreneur.description,
        phone: entrepreneur.phone || '',
        email: entrepreneur.email || '',
        website: entrepreneur.website || ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      await entrepreneurService.updateEntrepreneur(entrepreneurId, {
        businessName: formData.businessName.trim(),
        businessType: formData.businessType,
        description: formData.description.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined
      });

      await loadProfile();
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (entrepreneur) {
      setFormData({
        businessName: entrepreneur.businessName,
        businessType: entrepreneur.businessType,
        description: entrepreneur.description,
        phone: entrepreneur.phone || '',
        email: entrepreneur.email || '',
        website: entrepreneur.website || ''
      });
    }
    setEditMode(false);
    setError('');
  };

  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!entrepreneur) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>Profile not found</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {entrepreneur.businessName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={entrepreneur.verified ? 'default' : 'secondary'}>
                {entrepreneur.verified ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending Verification
                  </>
                )}
              </Badge>
              <Badge variant="outline">{entrepreneur.businessType}</Badge>
            </div>
          </div>
          {!editMode && (
            <Button onClick={() => setEditMode(true)} size="sm" variant="outline">
              <Edit2 className="h-4 w-4 mr-1" />
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold">{entrepreneur.enrollmentCount || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Hub Enrollments</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold">{entrepreneur.servicesCount || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Services Received</div>
          </div>
        </div>

        {editMode ? (
          // Edit Form
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
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
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          // View Mode
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h3>
              <p className="text-gray-900 dark:text-gray-100">{entrepreneur.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entrepreneur.phone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">{entrepreneur.phone}</p>
                </div>
              )}

              {entrepreneur.email && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">{entrepreneur.email}</p>
                </div>
              )}
            </div>

            {entrepreneur.website && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Website
                </h3>
                <a
                  href={entrepreneur.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {entrepreneur.website}
                </a>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Profile created on {new Date(entrepreneur.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
