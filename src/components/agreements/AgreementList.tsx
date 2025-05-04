
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { Agreement } from '@/types/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';

const AgreementList: React.FC = () => {
  const {
    agreements,
    isLoading,
    error,
    rowSelection,
    setRowSelection,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    handleBulkDelete
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
  })) as Agreement[];

  return (
    <div>
      <AgreementTable
        agreements={typedAgreements}
        isLoading={isLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        deleteAgreement={handleBulkDelete}
      />
    </div>
  );
};

export default AgreementList;
