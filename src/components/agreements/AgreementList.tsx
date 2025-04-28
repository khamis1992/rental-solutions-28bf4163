import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { asStatusColumn } from '@/types/agreement-types';
import type { AgreementStatus } from '@/types/agreement-types';

const AgreementList: React.FC = () => {
  const {
    data: agreements,
    isLoading,
    isError,
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

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  const handleStatusChange = (agreementId: string, status: AgreementStatus) => {
    updateAgreement(agreementId, { status: asStatusColumn(status) });
  };

  return (
    <div>
      <AgreementTable
        data={agreements}
        isLoading={isLoading}
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default AgreementList;
