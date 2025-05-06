
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AgreementLoadingStateProps {
  isLoading: boolean;
  hasAgreement: boolean;
}

export const AgreementLoadingState: React.FC<AgreementLoadingStateProps> = ({
  isLoading,
  hasAgreement
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!hasAgreement) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
        <p className="text-muted-foreground">
          The agreement you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return null;
};
