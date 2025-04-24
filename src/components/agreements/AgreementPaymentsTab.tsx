
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PaymentList } from '@/components/payments/PaymentList';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { EmptyPaymentState } from '@/components/payments/EmptyPaymentState';

interface AgreementPaymentsTabProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
  agreementId: string;
}

export const AgreementPaymentsTab = ({
  payments,
  isLoading,
  rentAmount,
  onPaymentDeleted,
  leaseStartDate,
  leaseEndDate,
  agreementId
}: AgreementPaymentsTabProps) => {
  // Add state to force refresh of payment list
  const [refreshKey, setRefreshKey] = useState(0);

  // Enhanced payment deleted handler that triggers both parent refresh and local refresh
  const handlePaymentDeleted = (paymentId: string) => {
    console.log("AgreementPaymentsTab: Payment deleted", paymentId);
    onPaymentDeleted();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Track payments and financial transactions for this agreement</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p>Loading payments...</p>
            </div>
          ) : agreementId ? (
            <PaymentList 
              key={`payment-list-${agreementId}-${refreshKey}`}
              agreementId={agreementId}
              onDeletePayment={handlePaymentDeleted}
            />
          ) : (
            <EmptyPaymentState />
          )}
        </CardContent>
      </Card>
      
      {Array.isArray(payments) && payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Analytics</CardTitle>
            <CardDescription>Financial metrics for this agreement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">
                  QAR {payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Late Fees</p>
                <p className="text-2xl font-bold">
                  QAR {payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
