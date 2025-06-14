import React from 'react';
import { Button } from '@/components/ui/button';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';

export interface LegalCaseFormActionsProps {
  onCancel?: () => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export function LegalCaseFormActions({ onCancel, isSubmitting, isEdit }: LegalCaseFormActionsProps) {
  return (
    <div className="flex gap-2">
      <TooltipWrapper content={isEdit ? 'Update this legal case.' : 'Create a new legal case.'}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
        </Button>
      </TooltipWrapper>
      {onCancel && (
        <TooltipWrapper content="Cancel and return to the previous page.">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}
