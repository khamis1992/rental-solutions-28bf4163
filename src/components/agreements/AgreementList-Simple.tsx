
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementCardView } from './AgreementCardView';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Agreement } from '@/types/agreement';

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

  // Process the agreements data to ensure correct types
  // We're converting directly to Agreement[] to avoid type issues
  const typedAgreements: Agreement[] = agreements ? 
    agreements.map((agreement: any) => ({
      id: agreement.id,
      status: agreement.status,
      customer_id: agreement.customer_id,
      vehicle_id: agreement.vehicle_id,
      start_date: agreement.start_date,
      end_date: agreement.end_date,
      // Add any other required fields
      amount: agreement.amount,
      rent_amount: agreement.rent_amount,
      // Add fallbacks for any potentially missing fields
      created_at: agreement.created_at || new Date().toISOString(),
    })) : [];

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
