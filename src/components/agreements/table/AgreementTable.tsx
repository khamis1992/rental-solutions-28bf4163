
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { TableContent } from './TableContent';
import { processAgreementData } from './agreement-data';

interface AgreementTableProps {
  compact?: boolean;
  agreements?: any[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    totalCount: number;
    handlePageChange: (page: number) => void;
  };
}

export default function AgreementTable({ 
  compact = false, 
  agreements: externalAgreements, 
  isLoading: externalLoading,
  pagination 
}: AgreementTableProps) {
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
      pagination={pagination}
    />
  );
}
