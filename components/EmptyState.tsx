import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action
}) => (
  <div className="text-center py-16 px-4 animate-fade-in rounded-lg border border-border bg-card/80 backdrop-blur-sm">
    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
    {action && (
      <Button onClick={action.onClick} className="bg-primary-600 hover:bg-primary-700">
        {action.label}
      </Button>
    )}
  </div>
);
