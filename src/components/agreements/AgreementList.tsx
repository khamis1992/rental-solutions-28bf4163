
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { Agreement } from '@/types/agreement';

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
  const typedAgreements = agreements?.map(agreement => ({
    ...agreement,
    payment_frequency: 'monthly', // Default value for type compatibility
    payment_day: 1, // Default value for type compatibility
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
