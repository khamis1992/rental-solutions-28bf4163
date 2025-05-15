
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementCardView } from './AgreementCardView';
import { Agreement } from '@/types/agreement';
import { SimplePagination } from '@/components/ui/simple-pagination';

export function AgreementList() {
  const {
    agreements,
    isLoading,
    error,
    handleBulkDelete,
    pagination,
  } = useAgreementTable();

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Cast agreements to the correct type with the required fields
  // We'll avoid the map transformations that were causing type errors
  const typedAgreements: Agreement[] = agreements || [];

  return (
    <div className="space-y-6">
      <AgreementCardView 
        agreements={typedAgreements}
        isLoading={isLoading}
        onDeleteAgreement={(id) => handleBulkDelete(id)}
      />
      
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center mt-6">
          <SimplePagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.handlePageChange}
          />
          <div className="text-sm text-muted-foreground text-center mt-2">
            Showing {agreements?.length || 0} of {pagination.totalCount} agreements
          </div>
        </div>
      )}
    </div>
  );
}
