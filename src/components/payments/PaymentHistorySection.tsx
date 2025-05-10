
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PaymentHistoryItem } from '@/types/payment-history.types';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { PaymentStatsCards } from './stats/PaymentStatsCards';
import { PaymentStatusBar } from './status/PaymentStatusBar';
import { PaymentTable } from './table/PaymentTable';
import { PaymentActions, PaymentTableActions } from './actions/PaymentActions';
import { EmptyPaymentState } from './empty/EmptyPaymentState';
import { PaymentAnalytics } from './analytics/PaymentAnalytics';
import { toast } from 'sonner';

interface PaymentHistoryProps {
  payments: PaymentHistoryItem[];
  isLoading: boolean;
  rentAmount: number | null;
  leaseId?: string;
  onPaymentDeleted?: (paymentId: string) => void;
  onPaymentUpdated?: (payment: Partial<PaymentHistoryItem>) => Promise<boolean>;
  onRecordPayment?: (payment: Partial<PaymentHistoryItem>) => void;
  showAnalytics?: boolean;
}

export function PaymentHistorySection({
  payments = [],
  isLoading,
  rentAmount,
  leaseId,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  showAnalytics = true
}: PaymentHistoryProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null);

  // Calculate payment statistics
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const amountPaid = payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
  const balance = totalAmount - amountPaid;
  const lateFees = payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);

  // Calculate payment status counts
  const paidOnTime = payments.filter(p => p.status === 'completed' && (!p.days_overdue || p.days_overdue === 0)).length;
  const paidLate = payments.filter(p => p.status === 'completed' && p.days_overdue && p.days_overdue > 0).length;
  const unpaid = payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

  const handlePaymentCreated = (payment: Partial<PaymentHistoryItem>) => {
    if (onRecordPayment) {
      onRecordPayment(payment);
      setIsPaymentDialogOpen(false);
    }
  };

  const handleEditPayment = (payment: PaymentHistoryItem) => {
    setSelectedPayment(payment);
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPaymentClick = () => {
    setSelectedPayment(null);
    setIsPaymentDialogOpen(true);
  };

  const handleDeletePayment = (paymentId: string) => {
    if (onPaymentDeleted) {
      // Confirm deletion with the user
      if (window.confirm('Are you sure you want to delete this payment?')) {
        onPaymentDeleted(paymentId);
      }
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
  ) => {
    if (selectedPayment && selectedPayment.id && onPaymentUpdated) {
      try {
        const paymentData: Partial<PaymentHistoryItem> = {
          id: selectedPayment.id,
          amount,
          payment_date: date.toISOString(),
          description: notes,
          payment_method: method,
          transaction_id: reference,
          status: 'completed',
          type: paymentType || selectedPayment.type || 'rent'
        };
        
        const success = await onPaymentUpdated(paymentData);
        if (success) {
          toast.success("Payment updated successfully");
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
      const paymentData: Partial<PaymentHistoryItem> = {
        amount,
        payment_date: date.toISOString(),
        description: notes,
        payment_method: method,
        transaction_id: reference,
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
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 rounded-full"></div>
        </div>
      );
    }

    if (payments.length === 0) {
      return <EmptyPaymentState onRecordPayment={handleRecordPaymentClick} />;
    }

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

        <PaymentActions 
          rentAmount={rentAmount} 
          onRecordPaymentClick={handleRecordPaymentClick} 
        />
        
        <PaymentTable 
          payments={payments} 
          onEditPayment={handleEditPayment}
          onDeletePayment={handleDeletePayment}
        />
        
        <PaymentTableActions />
      </>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Track all financial transactions for this agreement</CardDescription>
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
          description={selectedPayment ? "Update payment details" : "Add a new payment to this agreement"}
          leaseId={leaseId}
          rentAmount={rentAmount}
          selectedPayment={selectedPayment}
        />
      )}
      
      {/* Only render the analytics section if showAnalytics is true */}
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
