
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { mapDbToAgreement } from '@/services/agreement/transformations';

const AgreementList: React.FC = () => {
  const {
    agreements,
    isLoading,
    error,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    rowSelection,
    setRowSelection,
    handleBulkDelete
  } = useAgreementTable();

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Map database agreements to proper Agreement type including required fields
  const mappedAgreements = agreements?.map(agreement => mapDbToAgreement(agreement)) || [];

  return (
    <div>
      <AgreementTable
        agreements={mappedAgreements}
        isLoading={isLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        deleteAgreement={handleBulkDelete}
      />
    </div>
  );
};

export default AgreementList;
