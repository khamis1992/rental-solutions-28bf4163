
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { TableContent } from './table/TableContent';
import { processAgreementData } from './table/agreement-data';
import { bypass } from '@/lib/typescript-bypass';

const AgreementList = () => {
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

  // Process agreement data for display with type bypass
  const typedAgreements = processAgreementData(bypass.any(agreements) || []);

  return (
    <TableContent 
      agreements={typedAgreements}
      isLoading={isLoading}
      pagination={undefined}
    />
  );
};

export default AgreementList;
