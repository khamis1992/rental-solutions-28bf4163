
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { TableContent } from './table/TableContent';

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

  console.log('📊 AgreementList received:', { 
    agreementsType: typeof agreements, 
    isArray: Array.isArray(agreements),
    count: agreements?.length || 0 
  });

  // Process agreements with proper type checking
  const typedAgreements = Array.isArray(agreements) && agreements.length > 0 
    ? (agreements as any[]).map(agreement => ({
        ...agreement,
        confirmation_email_sent: agreement.confirmation_email_sent ?? false,
        down_payment: agreement.down_payment ?? 0
      }))
    : [];

  console.log('✅ AgreementList processed:', typedAgreements.length, 'agreements');

  return (
    <TableContent 
      agreements={typedAgreements}
      isLoading={isLoading}
      pagination={undefined}
    />
  );
};

export default AgreementList;
