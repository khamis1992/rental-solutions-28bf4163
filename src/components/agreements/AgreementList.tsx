
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { AgreementStatus } from '@/types/database-common';

// Define the props that AgreementTable expects
type AgreementTableProps = React.ComponentProps<typeof AgreementTable>;

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

  const handleStatusChange = (agreementId: string, status: AgreementStatus) => {
    updateAgreement(agreementId, { status });
  };

  return (
    <div>
      <AgreementTable
        agreements={agreements}
        isLoading={isLoading}
        pagination={pagination || {
          pageIndex: 0,
          pageSize: 10,
        }}
        setPagination={setPagination}
        sorting={sorting || []}
        setSorting={setSorting}
        globalFilter={globalFilter || ''}
        setGlobalFilter={setGlobalFilter}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default AgreementList;
