
import React from 'react';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { TableContent } from './table/TableContent';
import { processAgreementData } from './table/agreement-data';

const AgreementList = () => {
  const {
    agreements,
    isLoading,
    error,
    pagination
  } = useAgreementService();

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

export default AgreementList;
