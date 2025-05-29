
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Payment } from '@/types/payment.types';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { PaymentStatsCards } from './stats/PaymentStatsCards';
import { PaymentStatusBar } from './status/PaymentStatusBar';
import { PaymentActions } from './actions/PaymentActions';
import { PaymentAnalytics } from './analytics/PaymentAnalytics';
import { UnifiedPaymentDisplay } from './UnifiedPaymentDisplay';
import { usePaymentScheduleManagement } from '@/hooks/payment/use-payment-schedule-management';
import { usePaymentCalculation } from '@/hooks/payment/use-payment-calculation';
import { Agreement } from '@/types/agreement';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { generatePaymentHistoryPdf } from '@/utils/report-utils';
import { formatDate } from '@/lib/date-utils';

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  leaseId?: string;
  contractAmount?: number | null;
  onPaymentDeleted?: (paymentId: string) => void;
  onPaymentUpdated?: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment?: (payment: Partial<Payment>) => void;
  showAnalytics?: boolean;
  agreement?: Agreement | null;
}

export function PaymentHistorySection({
  payments = [],
  isLoading,
  rentAmount,
  leaseId,
  contractAmount = null,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  showAnalytics = true,
  agreement = null
}: PaymentHistoryProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Use payment schedule management
  const {
    paymentSchedule,
    isLoading: isLoadingSchedule
  } = usePaymentScheduleManagement(agreement?.id);
  
  // Use the payment calculation hook
  const {
    totalAmount,
    amountPaid,
    balance,
    lateFees
  } = usePaymentCalculation(payments, contractAmount);
  
  // Calculate payment status counts from actual payments only
  const paidOnTime = payments.filter(p => p.status === 'completed').length;
  const paidLate = 0; // TODO: Implement late payment detection
  const unpaid = payments.filter(p => p.status === 'pending' || p.status === 'failed').length;

  const handlePaymentCreated = (payment: Partial<Payment>) => {
    if (onRecordPayment) {
      onRecordPayment(payment);
      setIsPaymentDialogOpen(false);
    }
  };

  const handleRecordPaymentClick = () => {
    setSelectedPayment(null);
    setIsPaymentDialogOpen(true);
  };

  const handleRecordScheduledPayment = (scheduleItem: any) => {
    // Pre-fill payment dialog with schedule item data
    setSelectedPayment({
      amount: scheduleItem.amount,
      due_date: scheduleItem.due_date,
      description: scheduleItem.description || `Payment for ${formatDate(new Date(scheduleItem.due_date), 'MMM yyyy')}`,
      lease_id: leaseId
    } as Payment);
    setIsPaymentDialogOpen(true);
  };

  const handleExportHistoryClick = () => {
    try {
      const paymentHistoryData = payments.map(payment => ({
        description: payment.description || 'Payment',
        amount: payment.amount || 0,
        dueDate: payment.due_date ? formatDate(payment.due_date, 'MMM d, yyyy') : '',
        paymentDate: payment.payment_date ? formatDate(payment.payment_date, 'MMM d, yyyy') : '',
        status: payment.status || '',
        lateFee: payment.late_fine_amount || 0,
        total: (payment.amount || 0) + (payment.late_fine_amount || 0)
      }));

      const doc = generatePaymentHistoryPdf(paymentHistoryData, "Payment History");
      doc.save("payment-history.pdf");
      toast.success("Payment history exported successfully");
    } catch (error) {
      console.error("Error exporting payment history:", error);
      toast.error("Failed to export payment history");
    }
  };

  const handlePaymentSubmit = async (
    amount: number, 
    date: Date, 
    notes?: string, 
    method?: string, 
    reference?: string, 
    includeLatePaymentFee?: boolean,
    isPartial?: boolean,
    paymentType?: string
  ): Promise<boolean> => {
    if (selectedPayment && selectedPayment.id && onPaymentUpdated) {
      try {
        const paymentData: Partial<Payment> = {
          id: selectedPayment.id,
          amount,
          payment_date: date.toISOString(),
          description: notes,
          payment_method: method,
          reference_number: reference,
          status: amount === 0 ? 'cancelled' : 'completed',
          type: paymentType || selectedPayment.type || 'rent',
        };
        
        const success = await onPaymentUpdated(paymentData);
        if (success) {
          toast.success(amount === 0 ? "Payment cancelled successfully" : "Payment updated successfully");
          setIsPaymentDialogOpen(false);
          return true;
        } else {
          toast.error("Failed to update payment");
          return false;
        }
      } catch (error) {
        console.error("Error updating payment:", error);
        toast.error("Failed to update payment");
        return false;
      }
    } else if (onRecordPayment && leaseId) {
      const paymentData: Partial<Payment> = {
        amount,
        payment_date: date.toISOString(),
        description: notes,
        payment_method: method,
        reference_number: reference,
        lease_id: leaseId,
        status: 'completed',
        type: paymentType || 'rent'
      };
      
      handlePaymentCreated(paymentData);
      return true;
    }
    
    return false;
  };

  const currentIsLoading = isLoading || isLoadingSchedule;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Track all financial transactions and scheduled payments for this agreement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentIsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 rounded-full"></div>
            </div>
          ) : (
            <>
              <PaymentStatsCards 
                totalAmount={totalAmount} 
                amountPaid={amountPaid} 
                balance={balance} 
                lateFees={lateFees} 
              />
              
              <PaymentStatusBar 
                paidOnTime={paidOnTime} 
                paidLate={paidLate} 
                unpaid={unpaid} 
                totalPayments={payments.length} 
              />

              <div className="flex justify-between items-center mb-4">
                <PaymentActions 
                  rentAmount={rentAmount} 
                  onRecordPaymentClick={handleRecordPaymentClick}
                  onExportHistoryClick={handleExportHistoryClick}
                />
              </div>
              
              <UnifiedPaymentDisplay
                payments={payments}
                scheduleItems={paymentSchedule}
                onRecordPayment={handleRecordScheduledPayment}
                isLoading={currentIsLoading}
              />
            </>
          )}
        </CardContent>
      </Card>
      
      {isPaymentDialogOpen && (
        <PaymentEntryDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          onSubmit={handlePaymentSubmit}
          defaultAmount={selectedPayment ? selectedPayment.amount : rentAmount || 0}
          title={selectedPayment ? "Record Payment" : "Record Payment"}
          description={selectedPayment ? "Record payment for scheduled item" : "Add a new payment to this agreement"}
          leaseId={leaseId}
          rentAmount={rentAmount}
          selectedPayment={selectedPayment}
        />
      )}
      
      {showAnalytics && (
        <PaymentAnalytics
          amountPaid={amountPaid}
          balance={balance}
          lateFees={lateFees}
        />
      )}
    </div>
  );
}
