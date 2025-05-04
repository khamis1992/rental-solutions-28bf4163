
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { LeaseStatus } from '@/lib/database/utils';
import { Agreement } from '@/types/agreement';

const AgreementList: React.FC = () => {
  const {
    agreements,
    isLoading,
    error,
    updateAgreement,
    deleteAgreement,
    rowSelection,
    setRowSelection,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
  } = useAgreementTable();

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Cast agreements to the correct type
  const typedAgreements: Agreement[] = agreements as unknown as Agreement[];

  return (
    <div>
      <AgreementTable
        agreements={typedAgreements}
        isLoading={isLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        deleteAgreement={deleteAgreement}
      />
    </div>
  );
};

export default AgreementList;
