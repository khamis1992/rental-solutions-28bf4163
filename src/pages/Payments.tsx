
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import { usePayments } from '@/hooks/use-payments';
import { useParams } from 'react-router-dom';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useAgreement } from '@/hooks/use-agreements';
import { DollarSign } from 'lucide-react';
import { hasData } from '@/utils/database-type-helpers';
import { UUID } from '@/types/database-types';

const Payments = () => {
  const { id } = useParams<{ id: string }>();
  const { payments, isLoading: isLoadingPayments, fetchPayments } = usePayments(id || '');
  const { agreement } = useAgreement(id as UUID);
  const { rentAmount } = useRentAmount(agreement, id || '');

  return (
    <PageContainer>
      <SectionHeader 
        title="Payment History" 
        description="View and manage payment records"
        icon={DollarSign}
      />
      
      <PaymentHistory 
        payments={payments || []}
        onPaymentDeleted={fetchPayments}
        leaseStartDate={agreement?.start_date}
        leaseEndDate={agreement?.end_date}
        rentAmount={rentAmount}
      />
    </PageContainer>
  );
};

export default Payments;
