
import React from 'react';
import { Button } from '@/components/ui/button';

interface MaintenanceFormActionsProps {
  isSubmitting: boolean;
  hasInitialData: boolean;
  onCancel?: () => void;
}

export const MaintenanceFormActions: React.FC<MaintenanceFormActionsProps> = ({
  isSubmitting,
  hasInitialData,
  onCancel
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      <Button variant="outline" type="button" onClick={handleCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : hasInitialData ? 'Update' : 'Create'}
      </Button>
    </div>
  );
};
