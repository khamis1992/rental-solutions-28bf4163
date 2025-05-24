
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Payment } from '@/types/payment.types';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { PaymentStatsCards } from './stats/PaymentStatsCards';
import { PaymentStatusBar } from './status/PaymentStatusBar';
import { PaymentActions } from './actions/PaymentActions';
import { PaymentAnalytics } from './analytics/PaymentAnalytics';
import { UnifiedPaymentTable } from './UnifiedPaymentTable';
import { useUnifiedPayments } from '@/hooks/payment/use-unified-payments';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Filter, ToggleLeft, ToggleRight } from 'lucide-react';
import { generatePaymentHistoryPdf } from '@/utils/report-utils';
import { formatDate } from '@/lib/date-utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePaymentCalculation } from '@/hooks/payment/use-payment-calculation';
import { Agreement } from '@/types/agreement';

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
  const [showProjectedPayments, setShowProjectedPayments] = useState(true);

  // Use unified payments hook
  const {
    unifiedPayments,
    hasSchedule,
    recordProjectedPayment,
    isLoading: isLoadingUnified
  } = useUnifiedPayments({
    agreement,
    showProjectedPayments
  });
  
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
  const unpaid = payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

  const handlePaymentCreated = (payment: Partial<Payment>) => {
    if (onRecordPayment) {
      onRecordPayment(payment);
      setIsPaymentDialogOpen(false);
    }
  };

  const handleRecordProjectedPayment = (scheduledPayment: any) => {
    if (agreement) {
      recordProjectedPayment(scheduledPayment)
        .then(() => {
          toast.success("Payment recorded successfully");
        })
        .catch((error) => {
          console.error("Error recording payment:", error);
          toast.error("Failed to record payment");
        });
    }
  };

  const handleRecordPaymentClick = () => {
    setSelectedPayment(null);
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
          status: amount === 0 ? 'voided' : 'completed',
          type: paymentType || selectedPayment.type || 'rent',
        };
        
        const success = await onPaymentUpdated(paymentData);
        if (success) {
          toast.success(amount === 0 ? "Payment voided successfully" : "Payment updated successfully");
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

  const renderPaymentHistory = () => {
    const currentIsLoading = isLoading || isLoadingUnified;
    
    if (currentIsLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 rounded-full"></div>
        </div>
      );
    }

    // Show unified payments if we have a schedule or actual payments
    if (hasSchedule || payments.length > 0) {
      return (
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
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProjectedPayments(!showProjectedPayments)}
                className="flex items-center gap-2"
              >
                {showProjectedPayments ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
                Show Schedule
              </Button>
            </div>
          </div>
          
          <UnifiedPaymentTable 
            payments={unifiedPayments} 
            onRecordPayment={handleRecordProjectedPayment}
            isLoading={currentIsLoading}
            showProjectedPayments={showProjectedPayments}
          />
        </>
      );
    }

    // Empty state
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No payment history available</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={handleRecordPaymentClick}
        >
          Record First Payment
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Track all financial transactions for this agreement
            {hasSchedule && showProjectedPayments && (
              <span className="block text-blue-600 text-sm mt-1">
                Showing payment schedule with projected payments
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderPaymentHistory()}
        </CardContent>
      </Card>
      
      {isPaymentDialogOpen && (
        <PaymentEntryDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          onSubmit={handlePaymentSubmit}
          defaultAmount={selectedPayment ? selectedPayment.amount : rentAmount || 0}
          title={selectedPayment ? "Edit Payment" : "Record Payment"}
          description={selectedPayment ? "Update payment details or set amount to 0 to void transaction" : "Add a new payment to this agreement"}
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
