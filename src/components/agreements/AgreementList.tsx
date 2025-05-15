
import React from 'react';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { TableContent } from './table/TableContent';
import { processAgreementData } from './table/agreement-data';

const AgreementList: React.FC = () => {
  const {
    agreements,
    isLoading,
    error
  } = useAgreementService();

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Process agreement data for display with correct type conversion
  const typedAgreements = processAgreementData(agreements || []);

  return (
    <TableContent 
      agreements={typedAgreements}
      isLoading={isLoading}
      pagination={undefined}
    />
  );
};

export default AgreementList;
