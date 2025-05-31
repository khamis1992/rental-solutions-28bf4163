
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { TableContent } from './table/TableContent';
import { processAgreementData } from './table/agreement-data';

interface AgreementTableProps {
  compact?: boolean;
  agreements?: any[];
  isLoading?: boolean;
}

export default function AgreementTable({ compact = false, agreements: externalAgreements, isLoading: externalLoading }: AgreementTableProps) {
  const {
    agreements: internalAgreements,
    isLoading: internalLoading,
    error,
  } = useAgreementService();

  const agreements = externalAgreements ?? internalAgreements;
  const isLoading = externalLoading ?? internalLoading;
  
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
