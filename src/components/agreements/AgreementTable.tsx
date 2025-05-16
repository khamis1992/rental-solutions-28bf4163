
import React from 'react';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { TableContent } from './table/TableContent';
import { processAgreementData } from './table/agreement-data';

interface AgreementTableProps {
  compact?: boolean;
}

export default function AgreementTable({ compact = false }: AgreementTableProps) {
  const {
    agreements,
    isLoading,
    error,
    deleteAgreement
  } = useAgreementService();
  
  // Process agreement data for display
  const typedAgreements = processAgreementData(agreements || []);

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <TableContent 
      agreements={typedAgreements}
      isLoading={isLoading}
      compact={compact}
      pagination={undefined}
    />
  );
}
