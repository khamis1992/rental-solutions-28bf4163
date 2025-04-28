
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { mapDbToAgreement } from '@/utils/type-adapters';

const AgreementList: React.FC = () => {
  const {
    agreements,
    isLoading,
    error,
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

  // Map database agreements to proper Agreement type including required fields
  const mappedAgreements = agreements?.map(agreement => ({
    ...mapDbToAgreement(agreement),
    // Add the required fields that might be missing from mapDbToAgreement
    payment_frequency: agreement.payment_frequency || 'monthly',
    payment_day: agreement.rent_due_day || 1,
  })) || [];

  return (
    <div>
      <AgreementTable
        agreements={mappedAgreements}
        isLoading={isLoading}
        // Remove sorting props as they might not be supported by AgreementTable
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
    </div>
  );
};

export default AgreementList;
