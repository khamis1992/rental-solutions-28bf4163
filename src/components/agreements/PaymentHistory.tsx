import { Payment } from '@/types/payment.types';
import { PaymentHistorySection } from '@/components/payments/PaymentHistorySection';
import { Agreement } from '@/types/agreement';
import { useSynchronizedPaymentManagement } from '@/hooks/payment/use-synchronized-payment-management';
import { useEffect, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorLogger } from '@/lib/errors/error-logger';

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
      errorLogger.logInfo('Payment schedule auto-sync initiated', {
        context: 'PaymentHistory',
        leaseId,
        syncStatus: syncStatus?.synchronized,
        unsyncedCount: syncStatus?.unsyncedCount
      });
      syncCheckRef.current = true;
      
      // Add a delay to prevent immediate sync
      const timeoutId = setTimeout(() => {
        checkAndSync();
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [leaseId, syncStatus?.synchronized, isSynchronized, checkAndSync]);

  if (process.env.NODE_ENV === 'development') {
    errorLogger.logInfo('PaymentHistory component state', {
      context: 'PaymentHistory',
      paymentsCount: payments?.length || 0,
      isLoading,
      leaseId,
      agreementId: agreement?.id,
      isSynchronized,
      syncCheckPerformed: syncCheckRef.current
    });
  }

  // Convert dates to strings for the PaymentHistorySection
  const startDateString = leaseStartDate 
    ? (typeof leaseStartDate === 'string' ? leaseStartDate : leaseStartDate.toISOString()) 
    : null;
  const endDateString = leaseEndDate 
    ? (typeof leaseEndDate === 'string' ? leaseEndDate : leaseEndDate.toISOString()) 
    : null;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Synchronization Status Alert - Only show if there are actual sync issues */}
      {syncStatus && !isSynchronized && syncStatus.unsyncedCount > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between flex-row-reverse">
            <div>
              <span className="text-yellow-800 text-right">
                تحتاج جدولة الدفعات إلى مزامنة 
                ({syncStatus.unsyncedCount} من {syncStatus.totalSchedule} عنصر يحتاج إلى اهتمام)
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={checkAndSync}
              disabled={loadingStates.autoSync}
              className="mr-4"
            >
              {loadingStates.autoSync ? 'جاري المزامنة...' : 'مزامنة الآن'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Show synchronized status only when explicitly synchronized */}
      {syncStatus && isSynchronized && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-right">
            <span className="text-green-800">جدولة الدفعات متزامنة</span>
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
