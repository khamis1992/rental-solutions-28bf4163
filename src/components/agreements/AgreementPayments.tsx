
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Payment } from '@/components/agreements/PaymentHistory';
import { PaymentList } from '@/components/payments/PaymentList';

interface AgreementPaymentsProps {
  agreementId: string;
  payments?: Payment[];
  isLoading: boolean;
  onPaymentUpdate: () => void;
}

const AgreementPayments: React.FC<AgreementPaymentsProps> = ({ 
  agreementId, 
  isLoading,
  onPaymentUpdate 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <PaymentList 
          agreementId={agreementId} 
          onPaymentDeleted={onPaymentUpdate} 
        />
      </CardContent>
    </Card>
  );
};

export default AgreementPayments;
