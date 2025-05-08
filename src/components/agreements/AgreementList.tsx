
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { TableContent } from './table/TableContent';
import { processAgreementData } from './table/agreement-data';

export const AgreementList: React.FC = () => {
  const {
    agreements,
    isLoading,
    error,
    pagination
  } = useAgreementTable();

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Process agreement data for display
  const typedAgreements = processAgreementData(agreements || []);

  return (
    <TableContent
      agreements={typedAgreements}
      isLoading={isLoading}
      pagination={pagination}
    />
  );
};
