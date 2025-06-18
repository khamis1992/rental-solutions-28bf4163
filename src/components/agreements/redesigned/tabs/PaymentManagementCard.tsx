import React, { useEffect, useState } from 'react';
import '@/styles/legal-rtl.css';
import { Agreement } from '@/types/agreement';
import { Payment } from '@/types/payment.types';
import { PaymentHistorySection } from '@/components/payments/redesigned/PaymentHistorySection';
import { PaymentAnalytics } from '@/components/payments/analytics/PaymentAnalytics';
import { agreementPaymentService } from '@/services/AgreementPaymentService';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PaymentManagementCardProps {
  agreement: Agreement;
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  paymentMetrics: any;
  onPaymentDeleted: (paymentId: string) => Promise<void>;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment: (payment: Partial<Payment>) => Promise<void>;
  fetchPayments: () => void;
  getDateString: (date: string | Date) => string;
}

export function PaymentManagementCard({
  agreement,
  payments,
  isLoading,
  rentAmount,
  contractAmount,
  paymentMetrics,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  fetchPayments,
  getDateString
}: PaymentManagementCardProps) {
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [autoCreationStatus, setAutoCreationStatus] = useState<{
    attempted: boolean;
    success?: boolean;
    message?: string;
  }>({ attempted: false });

  // Check if agreement has existing payments
  const hasExistingPayments = payments && payments.length > 0;

  // Automatic payment schedule creation
  useEffect(() => {
    const createPaymentScheduleAutomatically = async () => {
      // Only attempt once per component mount
      if (autoCreationStatus.attempted || isLoading || !agreement?.id) {
        return;
      }

      // Mark as attempted to prevent multiple calls
      setAutoCreationStatus({ attempted: true });

      console.log('🔄 Checking payments and attempting automatic creation for agreement:', agreement.id);
      setIsAutoCreating(true);

      try {
        // Check directly from database to ensure we have the latest data
        const { data: existingPayments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select('id')
          .eq('lease_id', agreement.id)
          .limit(1);

        if (paymentsError) {
          console.error('❌ Error checking existing payments:', paymentsError);
          setAutoCreationStatus({
            attempted: true,
            success: false,
            message: `خطأ في التحقق من المدفوعات: ${paymentsError.message}`
          });
          return;
        }

        const hasPayments = existingPayments && existingPayments.length > 0;
        console.log(`📊 Found ${existingPayments?.length || 0} existing payments for agreement ${agreement.id}`);

        if (hasPayments) {
          console.log('ℹ️ Payments already exist, skipping automatic creation');
          setAutoCreationStatus({
            attempted: true,
            success: true,
            message: 'جدولة المدفوعات موجودة بالفعل'
          });
          return;
        }

        // No payments found, create them automatically
        console.log('🚀 No payments found, creating payment schedule automatically...');
        const result = await agreementPaymentService.createPaymentScheduleByAgreementId(agreement.id);

        if (result.success && result.scheduleCount > 0) {
          console.log('✅ Automatic payment schedule created successfully');
          
          setAutoCreationStatus({
            attempted: true,
            success: true,
            message: `تم إنشاء ${result.scheduleCount} جدولة دفعات و ${result.paymentCount} دفعة تلقائياً`
          });

          // Show success notification
          toast.success('تم إنشاء جدولة المدفوعات تلقائياً', {
            description: `تم إنشاء ${result.scheduleCount} جدولة و ${result.paymentCount} دفعة`
          });

          // Refresh payments data
          setTimeout(() => {
            fetchPayments();
          }, 1000);

        } else if (result.success && result.scheduleCount === 0) {
          console.log('ℹ️ Payment schedule creation returned 0 items');
          setAutoCreationStatus({
            attempted: true,
            success: true,
            message: 'لم يتم إنشاء مدفوعات - قد تكون موجودة بالفعل'
          });
        } else {
          console.warn('⚠️ Failed to create payment schedule automatically:', result.error);
          setAutoCreationStatus({
            attempted: true,
            success: false,
            message: result.error || 'فشل في إنشاء جدولة المدفوعات تلقائياً'
          });
        }
      } catch (error) {
        console.error('❌ Error in automatic payment schedule creation:', error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
        
        setAutoCreationStatus({
          attempted: true,
          success: false,
          message: errorMessage
        });

        // Show error notification only for serious errors
        toast.error('خطأ في إنشاء جدولة المدفوعات', {
          description: errorMessage
        });
      } finally {
        setIsAutoCreating(false);
      }
    };

    // Run automatic creation after a small delay to ensure component is fully mounted
    const timeoutId = setTimeout(createPaymentScheduleAutomatically, 500);
    return () => clearTimeout(timeoutId);
  }, [agreement?.id, isLoading, fetchPayments, autoCreationStatus.attempted]);

  return (
    <div className="space-y-6 legal-rtl" dir="rtl">
      {/* Automatic Creation Status */}
      {isAutoCreating && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-right">
            جاري إنشاء جدولة المدفوعات تلقائياً...
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-creation result notification */}
      {autoCreationStatus.attempted && !isAutoCreating && autoCreationStatus.message && (
        <Alert variant={autoCreationStatus.success ? "default" : "destructive"}>
          {autoCreationStatus.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription className="text-right">
            <div className="space-y-1">
              <div className="font-medium">
                {autoCreationStatus.success ? 'تم إنشاء جدولة المدفوعات' : 'تنبيه'}
              </div>
              <div className="text-sm">{autoCreationStatus.message}</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Payment Analytics */}
      <PaymentAnalytics
        totalAmount={paymentMetrics.totalAmount}
        amountPaid={paymentMetrics.amountPaid}
        balance={paymentMetrics.balance}
        lateFees={paymentMetrics.lateFees}
        paidOnTime={paymentMetrics.paidOnTime}
        paidLate={paymentMetrics.paidLate}
        unpaid={paymentMetrics.unpaid}
      />

      {/* Redesigned Payment History */}
      <PaymentHistorySection 
        payments={payments} 
        isLoading={isLoading} 
        rentAmount={rentAmount}
        contractAmount={contractAmount}
        leaseId={agreement.id}
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
