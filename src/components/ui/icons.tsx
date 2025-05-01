
import React from 'react';
import { AlertCircle as LucideAlertCircle } from 'lucide-react';

export const AlertCircle: React.FC<React.ComponentProps<typeof LucideAlertCircle>> = (props) => {
  return <LucideAlertCircle {...props} />;
};

// Add other icons as needed
