
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementCardView } from './AgreementCardView';
import { Agreement } from '@/types/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';

export function AgreementList() {
  const {
    agreements,
    isLoading,
    error,
    handleBulkDelete,
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
    payment_frequency: 'monthly', // Default value for type compatibility
    payment_day: 1, // Default value for type compatibility
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
    <div>
      <AgreementCardView 
        agreements={typedAgreements}
        isLoading={isLoading}
        onDeleteAgreement={(id) => handleBulkDelete(id)}
      />
    </div>
  );
}
