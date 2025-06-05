
import { Payment } from '@/types/payment.types';
import { PaymentHistorySection } from '@/components/payments/PaymentHistorySection';
import { Agreement } from '@/types/agreement';
import { useSynchronizedPaymentManagement } from '@/hooks/payment/use-synchronized-payment-management';
import { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: (paymentId: string) => void;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment: (payment: Partial<Payment>) => Promise<void>;
  leaseStartDate: string | Date | null;
  leaseEndDate: string | Date | null;
  leaseId?: string;
  agreement?: Agreement | null;
  fetchPayments?: () => void;
}

export function PaymentHistory({
  payments,
  isLoading,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  leaseStartDate,
  leaseEndDate,
  leaseId,
  agreement,
  fetchPayments
}: PaymentHistoryProps) {
  
  // Use synchronized payment management - but only use sync status, not payments
  const {
    syncStatus,
    isSynchronized,
    checkAndSync,
    loadingStates
  } = useSynchronizedPaymentManagement(leaseId);

  // Auto-check synchronization on mount and when agreement changes
  useEffect(() => {
    if (leaseId && syncStatus && !isSynchronized) {
      console.log('Payment schedule not synchronized, will auto-sync');
      checkAndSync();
    }
  }, [leaseId, syncStatus, isSynchronized, checkAndSync]);

  // Log for debugging
  console.log('PaymentHistory component received:', {
    paymentsCount: payments?.length || 0,
    isLoading,
    leaseId,
    agreementId: agreement?.id,
    syncStatus,
    isSynchronized
  });

  // Convert dates to strings for the PaymentHistorySection
  const startDateString = leaseStartDate 
    ? (typeof leaseStartDate === 'string' ? leaseStartDate : leaseStartDate.toISOString()) 
    : null;
  const endDateString = leaseEndDate 
    ? (typeof leaseEndDate === 'string' ? leaseEndDate : leaseEndDate.toISOString()) 
    : null;

  return (
    <div className="space-y-4">
      {/* Synchronization Status Alert */}
      {syncStatus && (
        <Alert className={isSynchronized ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          {isSynchronized ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription className="flex items-center justify-between">
            <div>
              {isSynchronized ? (
                <span className="text-green-800">Payment schedule is synchronized</span>
              ) : (
                <span className="text-yellow-800">
                  Payment schedule needs synchronization 
                  ({syncStatus.unsyncedCount || 0} of {syncStatus.totalSchedule || 0} items need attention)
                </span>
              )}
            </div>
            {!isSynchronized && (
              <Button
                size="sm"
                variant="outline"
                onClick={checkAndSync}
                disabled={loadingStates.autoSync}
                className="ml-4"
              >
                {loadingStates.autoSync ? 'Syncing...' : 'Sync Now'}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment History Section - use original payments from props */}
      <PaymentHistorySection 
        payments={payments} 
        isLoading={isLoading} 
        rentAmount={rentAmount}
        contractAmount={contractAmount}
        leaseId={leaseId}
        onPaymentDeleted={onPaymentDeleted}
        onRecordPayment={onRecordPayment}
        onPaymentUpdated={onPaymentUpdated}
        showAnalytics={true}
        agreement={agreement}
        fetchPayments={fetchPayments}
      />
    </div>
  );
}
