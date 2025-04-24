
import React, { useState } from 'react';
import { format } from 'date-fns';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { PaymentEditDialog } from '@/components/agreements/PaymentEditDialog';
import { toast } from 'sonner';
import { generateMonthlyPaymentDates } from '@/lib/date-utils';

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
}

export const PaymentHistory = ({
  payments,
  isLoading,
  rentAmount,
  onPaymentDeleted,
  leaseStartDate,
  leaseEndDate
}: PaymentHistoryProps) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Function to calculate pending payments
  const calculatePendingPayments = () => {
    if (!leaseStartDate || !leaseEndDate || !rentAmount) {
      return [];
    }
    
    const start = new Date(leaseStartDate);
    const end = new Date(leaseEndDate);
    
    // Get all payment due dates in the lease period
    const allDueDates = generateMonthlyPaymentDates(start, end);
    
    // Filter out dates that already have payments
    const existingPaymentMonths = new Set(
      payments.map(payment => {
        const date = payment.payment_date ? new Date(payment.payment_date) : null;
        return date ? `${date.getFullYear()}-${date.getMonth()}` : null;
      }).filter(Boolean)
    );
    
    // Create pending payments for months without payments
    return allDueDates
      .filter(date => {
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        return !existingPaymentMonths.has(monthKey);
      })
      .map(due_date => ({
        due_date,
        amount: rentAmount
      }));
  };
  
  const pendingPayments = calculatePendingPayments();
  
  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };
  
  const handleDeletePayment = async (id: string) => {
    try {
      // Call the provided onPaymentDeleted callback
      onPaymentDeleted();
      toast.success("Payment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete payment");
      console.error("Error deleting payment:", error);
    }
  };
  
  const handleAddPayment = () => {
    // This would typically open a payment entry dialog
    // For now, we'll just show a toast message
    toast("Payment entry dialog would open here");
  };
  
  // Calculate payment statistics
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const totalDue = rentAmount ? (rentAmount * (pendingPayments.length + payments.length)) : 0;
  const paymentProgress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
  
  if (isLoading) {
    return <div>Loading payment history...</div>;
  }
  
  return (
    <div className="space-y-6">
      {rentAmount && totalDue > 0 && (
        <Card className="p-4">
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-muted-foreground">Payment Progress</span>
            <span className="text-sm font-medium">{Math.round(paymentProgress)}%</span>
          </div>
          <Progress value={paymentProgress} className="h-2" />
          <div className="mt-2 text-xs text-muted-foreground">
            Total Paid: QAR {totalPaid.toLocaleString()} of QAR {totalDue.toLocaleString()}
          </div>
        </Card>
      )}
      
      <PaymentsTable
        payments={payments}
        pendingPayments={pendingPayments}
        onDeletePayment={handleDeletePayment}
        onAddPayment={handleAddPayment}
      />
      
      <PaymentEditDialog 
        payment={selectedPayment}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSaved={onPaymentDeleted}
      />
    </div>
  );
};
