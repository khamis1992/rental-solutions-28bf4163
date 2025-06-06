import React from 'react';
import { Button } from '@/components/ui/button';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';

interface MaintenanceFormActionsProps {
  isSubmitting: boolean;
  hasInitialData: boolean;
  onCancel?: () => void;
}

export function MaintenanceFormActions({ isSubmitting, hasInitialData, onCancel }: MaintenanceFormActionsProps) {
  return (
    <div className="flex gap-2">
      <TooltipWrapper content="Save maintenance record.">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </TooltipWrapper>
      {hasInitialData && onCancel && (
        <TooltipWrapper content="Cancel and return to the previous page.">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}
