
import React from 'react';
import { Button } from '@/components/ui/button';

export interface LegalCaseFormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
}

export const LegalCaseFormActions: React.FC<LegalCaseFormActionsProps> = ({ 
  onCancel, 
  isSubmitting 
}) => {
  return (
    <div className="flex gap-4 justify-end">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Case'}
      </Button>
    </div>
  );
};
