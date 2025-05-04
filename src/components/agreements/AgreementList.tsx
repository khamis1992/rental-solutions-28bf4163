
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
    pagination,
    setPagination,
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
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
    </div>
  );
};

export default AgreementList;
