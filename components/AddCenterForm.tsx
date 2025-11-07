import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Plus, ArrowLeft } from 'lucide-react';
import { LocationPicker } from './LocationPicker';
import { LatLng } from '../utils/googleMaps';
import { availableResources, resourceCategories, ResourceCategory } from '../utils/resources';

interface CommunityCenterData {
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  services: string[];
  resources: string[];
  description: string;
  addedBy: 'admin' | 'visitor';
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

interface AddCenterFormProps {
  onAddCenter: (centerData: CommunityCenterData) => void;
  onBack: () => void;
  isAdmin: boolean;
}

const availableServices = [
  'Healthcare',
  'Education',
  'Skills Training',
  'Youth Programs',
  'Women Empowerment',
  'Childcare',
  'Vocational Training',
  'Computer Training',
  'Library',
  'Microfinance',
  'Food Security',
  'Mental Health',
  'Legal Aid',
  'Sports & Recreation',
  'Community Events'
];

// Kampala coordinates for different areas
const kampalaAreas = [
  { name: 'Central Division', lat: 0.3476, lng: 32.5825 },
  { name: 'Kawempe Division', lat: 0.3354, lng: 32.5659 },
  { name: 'Rubaga Division', lat: 0.3029, lng: 32.5599 },
  { name: 'Makindye Division', lat: 0.2735, lng: 32.6055 },
  { name: 'Nakawa Division', lat: 0.3373, lng: 32.6268 }
];

export function AddCenterForm({ onAddCenter, onBack, isAdmin }: AddCenterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    selectedServices: [] as string[],
    selectedResources: [] as string[],
    phone: '',
    email: '',
    website: '',
    coordinates: { lat: 0.3476, lng: 32.5825 } // Default to Central Kampala
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(service)
        ? prev.selectedServices.filter(s => s !== service)
        : [...prev.selectedServices, service]
    }));
  };

  const handleResourceToggle = (resource: string) => {
    setFormData(prev => ({
      ...prev,
      selectedResources: prev.selectedResources.includes(resource)
        ? prev.selectedResources.filter(r => r !== resource)
        : [...prev.selectedResources, resource]
    }));
  };

  const handleLocationSelect = (location: LatLng, address?: string) => {
    setFormData(prev => ({
      ...prev,
      location: address || prev.location,
      coordinates: { lat: location.lat, lng: location.lng }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!formData.name || !formData.location || !formData.description ||
        formData.selectedServices.length === 0 || formData.selectedResources.length === 0) {
      alert('Please fill in all required fields and select at least one service and one resource');
      setIsSubmitting(false);
      return;
    }

    const centerData: CommunityCenterData = {
      name: formData.name,
      location: formData.location,
      coordinates: formData.coordinates,
      services: formData.selectedServices,
      resources: formData.selectedResources,
      description: formData.description,
      addedBy: isAdmin ? 'admin' : 'visitor',
      contactInfo: {
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined
      }
    };

    onAddCenter(centerData);

    // Reset form
    setFormData({
      name: '',
      location: '',
      description: '',
      selectedServices: [],
      selectedResources: [],
      phone: '',
      email: '',
      website: '',
      coordinates: { lat: 0.3476, lng: 32.5825 }
    });

    setIsSubmitting(false);
    alert('Community center added successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Map
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Community Center</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            {isAdmin 
              ? 'As an admin, your submission will be automatically verified.'
              : 'Your submission will be reviewed by administrators before being verified.'
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg">Basic Information</h3>
              
              <div>
                <Label htmlFor="name">Center Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Kampala Community Hub"
                  required
                />
              </div>

              <div>
                <Label>Location *</Label>
                <LocationPicker
                  key={`location-picker-${formData.coordinates.lat}-${formData.coordinates.lng}`}
                  initialLocation={formData.coordinates}
                  onLocationSelect={handleLocationSelect}
                  className="mt-2"
                />
                <Input
                  className="mt-4"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Location name or address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the community center, its mission, and target community..."
                  rows={4}
                  required
                />
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg">Services Offered *</h3>
              <p className="text-sm text-gray-600">Select all services that apply:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableServices.map(service => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={formData.selectedServices.includes(service)}
                      onCheckedChange={() => handleServiceToggle(service)}
                    />
                    <Label htmlFor={service} className="text-sm cursor-pointer">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Available */}
            <div className="space-y-4">
              <h3 className="text-lg">Resources Available *</h3>
              <p className="text-sm text-gray-600">Select all resources that this center has available:</p>

              {/* Grouped by Category */}
              {(Object.keys(availableResources) as ResourceCategory[]).map((categoryKey) => (
                <div key={categoryKey} className="mb-6">
                  <h4 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    {resourceCategories[categoryKey]}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableResources[categoryKey].map((resource) => (
                      <div key={resource} className="flex items-center space-x-2">
                        <Checkbox
                          id={`resource-${resource}`}
                          checked={formData.selectedResources.includes(resource)}
                          onCheckedChange={() => handleResourceToggle(resource)}
                        />
                        <Label htmlFor={`resource-${resource}`} className="text-sm cursor-pointer">
                          {resource}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg">Contact Information</h3>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+256-700-000000"
                  type="tel"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@center.org"
                  type="email"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.center.org"
                  type="url"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Adding Center...' : 'Add Community Center'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}