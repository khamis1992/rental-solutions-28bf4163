
import React from 'react';
import { Button } from '@/components/ui/button';

export interface LegalCaseFormActionsProps {
  onCancel?: () => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export const LegalCaseFormActions: React.FC<LegalCaseFormActionsProps> = ({ 
  onCancel, 
  isSubmitting,
  isEdit = false 
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default behavior if no onCancel is provided
      window.history.back();
    }
  };

  return (
    <div className="flex gap-4 justify-end">
      <Button type="button" variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : isEdit ? 'Update Case' : 'Create Case'}
      </Button>
    </div>
  );
};
