
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementCardView } from './AgreementCardView';
import { Agreement } from '@/types/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { AgreementPagination } from '@/components/ui/agreement-pagination';

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
  const typedAgreements = agreements?.map((agreement: SimpleAgreement) => ({
    ...agreement,
    payment_frequency: agreement.payment_frequency || 'monthly', // Default value for type compatibility
    payment_day: agreement.payment_day || 1, // Default value for type compatibility
    customers: {
      full_name: agreement.customers?.full_name || agreement.customer_name || 'N/A',
      id: agreement.customers?.id || agreement.customer_id
    },
    // Convert string dates to Date objects
    start_date: agreement.start_date ? new Date(agreement.start_date) : new Date(),
    end_date: agreement.end_date ? new Date(agreement.end_date) : new Date(),
    created_at: agreement.created_at ? new Date(agreement.created_at) : undefined,
    updated_at: agreement.updated_at ? new Date(agreement.updated_at) : undefined
  })) as Agreement[];

  return (
    <div className="space-y-6">
      <AgreementCardView 
        agreements={typedAgreements}
        isLoading={isLoading}
        onDeleteAgreement={(id) => handleBulkDelete(id)}
      />
      
      {pagination && (
        <div className="flex flex-col items-center justify-center mt-6">
          <AgreementPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.handlePageChange}
          />
          <div className="text-sm text-muted-foreground text-center mt-2">
            Showing {agreements.length} of {pagination.totalCount} agreements
          </div>
        </div>
      )}
    </div>
  );
}
