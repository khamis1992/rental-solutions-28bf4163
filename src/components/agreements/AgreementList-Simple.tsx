import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementCardView } from './AgreementCardView';
import { Agreement } from '@/types/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { SimplePagination } from '@/components/ui/simple-pagination';

interface AgreementListProps {
  agreements?: SimpleAgreement[];
  isLoading?: boolean;
  onDeleteAgreement?: (id: string) => void;
  pagination?: {
    page: number;
    totalPages: number;
    totalCount: number;
    handlePageChange: (page: number) => void;
  };
}

export function AgreementList({
  agreements: externalAgreements,
  isLoading: externalLoading,
  onDeleteAgreement,
  pagination: externalPagination,
}: AgreementListProps) {
  const {
    agreements: internalAgreements,
    isLoading: internalLoading,
    error,
    deleteAgreements,
    pagination: internalPagination,
  } = useAgreementTable();

  const agreements = externalAgreements ?? internalAgreements;
  const isLoading = externalLoading ?? internalLoading;
  
  // Handle delete function - either use provided function or delete single agreement
  const handleDelete = onDeleteAgreement ?? (async (id: string) => {
    await deleteAgreements([id]);
  });
  
  const pagination = externalPagination ?? {
    page: internalPagination.pageIndex + 1,
    totalPages: Math.ceil(internalPagination.total / internalPagination.pageSize),
    totalCount: internalPagination.total,
    handlePageChange: () => {} // Simple implementation
  };

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Cast agreements to the correct type with the required fields
  const typedAgreements = agreements?.map((agreement: SimpleAgreement): Agreement => ({
    ...agreement,
    // Required properties from Agreement type
    agreement_type: agreement.agreement_type || 'short_term',
    total_amount: agreement.total_amount || agreement.rent_amount || 0,
    agreement_number: agreement.agreement_number || '',
    confirmation_email_sent: agreement.confirmation_email_sent || false,
    daily_late_fee: agreement.daily_late_fee || 0,
    deposit_amount: agreement.deposit_amount || 0,
    down_payment: agreement.down_payment || 0,
    notes: agreement.notes || '',
    rent_due_day: agreement.rent_due_day || agreement.payment_day || 1,
    
    // Ensure consistent typing
    payment_frequency: agreement.payment_frequency || 'monthly',
    payment_day: agreement.payment_day || 1,
    customers: {
      full_name: agreement.customers?.full_name || agreement.customer_name || 'N/A',
      id: agreement.customers?.id || agreement.customer_id
    },
    // Keep dates as strings to match Agreement type expectation
    start_date: typeof agreement.start_date === 'string' ? agreement.start_date : agreement.start_date?.toISOString() || '',
    end_date: typeof agreement.end_date === 'string' ? agreement.end_date : agreement.end_date?.toISOString() || '',
    created_at: typeof agreement.created_at === 'string' ? agreement.created_at : agreement.created_at?.toISOString() || '',
    updated_at: typeof agreement.updated_at === 'string' ? agreement.updated_at : agreement.updated_at?.toISOString() || ''
  })) || [];

  return (
    <div className="space-y-6">
      <AgreementCardView
        agreements={typedAgreements}
        isLoading={isLoading}
        onDeleteAgreement={handleDelete}
      />
      
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center mt-6">
          <SimplePagination
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
