
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
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
    pagination,
  } = useAgreementTable();
  
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
      pagination={pagination}
    />
  );
}
