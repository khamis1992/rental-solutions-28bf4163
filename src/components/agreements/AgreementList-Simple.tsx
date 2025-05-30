
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

  // Transform SimpleAgreement to Agreement with proper type safety
  const typedAgreements = agreements?.map((agreement: SimpleAgreement): Agreement => ({
    // Core database fields from SimpleAgreement
    id: agreement.id,
    agreement_number: agreement.agreement_number,
    status: agreement.status,
    start_date: agreement.start_date,
    end_date: agreement.end_date,
    rent_amount: agreement.rent_amount,
    customer_id: agreement.customer_id,
    vehicle_id: agreement.vehicle_id,
    payment_frequency: agreement.payment_frequency,
    payment_day: agreement.payment_day,
    rent_due_day: agreement.rent_due_day,
    confirmation_email_sent: agreement.confirmation_email_sent,
    daily_late_fee: agreement.daily_late_fee,
    deposit_amount: agreement.deposit_amount,
    down_payment: agreement.down_payment,
    notes: agreement.notes,
    created_at: agreement.created_at,
    updated_at: agreement.updated_at,
    
    // Required database fields with defaults
    agreement_type: 'short_term',
    total_amount: agreement.rent_amount || 0,
    
    // Relationship data
    customers: agreement.customers ? {
      id: agreement.customers.id,
      full_name: agreement.customers.full_name,
      email: agreement.customers.email || '',
      phone_number: agreement.customers.phone_number || '',
      address: agreement.customers.address || '',
      city: agreement.customers.city || '',
      state: agreement.customers.state || '',
      zip_code: agreement.customers.zip_code || '',
      role: agreement.customers.role || 'customer',
      created_at: agreement.customers.created_at || '',
      updated_at: agreement.customers.updated_at || ''
    } : undefined,
    vehicles: agreement.vehicles,
    
    // Computed fields for backward compatibility
    customer_name: agreement.customer_name,
    vehicle_info: agreement.vehicle_info
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
