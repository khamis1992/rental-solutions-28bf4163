
import { Payment } from '@/types/payment.types';
import { PaymentHistorySection } from '@/components/payments/PaymentHistorySection';
import { Agreement } from '@/types/agreement';
import { useSynchronizedPaymentManagement } from '@/hooks/payment/use-synchronized-payment-management';
import { useEffect, useRef } from 'react';
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
  
  const syncCheckRef = useRef<boolean>(false);
  
  // Use synchronized payment management - but only use sync status, not payments
  const {
    syncStatus,
    isSynchronized,
    checkAndSync,
    loadingStates
  } = useSynchronizedPaymentManagement(leaseId);

  // Auto-check synchronization only once per component lifecycle
  useEffect(() => {
    if (leaseId && syncStatus && !isSynchronized && !syncCheckRef.current) {
      console.log('Payment schedule not synchronized, will auto-sync (once)');
      syncCheckRef.current = true;
      
      // Add a delay to prevent immediate sync
      const timeoutId = setTimeout(() => {
        checkAndSync();
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [leaseId, syncStatus?.synchronized, isSynchronized, checkAndSync]);

  // Log for debugging
  console.log('PaymentHistory component received:', {
    paymentsCount: payments?.length || 0,
    isLoading,
    leaseId,
    agreementId: agreement?.id,
    syncStatus,
    isSynchronized,
    syncCheckPerformed: syncCheckRef.current
  });

  return (
    <div className="space-y-4">
      {/* Synchronization Status Alert - Only show if there are actual sync issues */}
      {syncStatus && !isSynchronized && syncStatus.unsyncedCount > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="text-yellow-800">
                Payment schedule needs synchronization 
                ({syncStatus.unsyncedCount} of {syncStatus.totalSchedule} items need attention)
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={checkAndSync}
              disabled={loadingStates.autoSync}
              className="ml-4"
            >
              {loadingStates.autoSync ? 'Syncing...' : 'Sync Now'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Show synchronized status only when explicitly synchronized */}
      {syncStatus && isSynchronized && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <span className="text-green-800">Payment schedule is synchronized</span>
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
