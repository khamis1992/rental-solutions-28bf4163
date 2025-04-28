
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { mapDbToAgreement } from '@/utils/type-adapters';

const AgreementList: React.FC = () => {
  const {
    agreements,
    isLoading,
    error,
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

  const mappedAgreements = agreements?.map(mapDbToAgreement) || [];

  return (
    <div>
      <AgreementTable
        agreements={mappedAgreements}
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
