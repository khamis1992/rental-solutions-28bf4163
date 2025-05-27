
import React from 'react';
import { Button } from '@/components/ui/button';

interface AgreementFormActionsProps {
  isSubmitting: boolean;
  onCancel?: () => void;
}

export const AgreementFormActions: React.FC<AgreementFormActionsProps> = ({ 
  isSubmitting, 
  onCancel = () => window.history.back() 
}) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button variant="outline" type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" className="bg-primary" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Agreement"}
      </Button>
    </div>
  );
};
