
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { LeaseStatus } from '@/types/lease-types';

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

  const handleStatusChange = (agreementId: string, status: LeaseStatus) => {
    updateAgreement(agreementId, { status });
  };

  return (
    <div>
      <AgreementTable
        agreements={agreements}
        isLoading={isLoading}
        onStatusChange={handleStatusChange}
        // Pass optional pagination props only if they exist
        {...(pagination && { pagination, setPagination })}
        {...(sorting && { sorting, setSorting })}
        {...(globalFilter !== undefined && { globalFilter, setGlobalFilter })}
      />
    </div>
  );
};

export default AgreementList;
