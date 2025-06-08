
import React from 'react';

interface PaymentHistorySectionProps {
  agreementId: string;
  onPaymentSelect: (payment: any) => void;
}

export const PaymentHistorySection: React.FC<PaymentHistorySectionProps> = ({
  agreementId,
  onPaymentSelect
}) => {
  return (
    <div className="text-center text-muted-foreground py-4">
      Payment history will be displayed here for agreement {agreementId}
    </div>
  );
};
