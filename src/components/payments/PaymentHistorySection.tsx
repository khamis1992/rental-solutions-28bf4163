
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
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { generatePaymentHistoryPdf } from '@/utils/report-utils';
import { formatDate } from '@/lib/date-utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PaymentHistoryProps {
  payments: PaymentHistoryItem[];
  isLoading: boolean;
  rentAmount: number | null;
  leaseId?: string;
  contractAmount?: number | null; // This prop receives the total contract amount
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
  contractAmount = null, // Default value is null
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  showAnalytics = true
}: PaymentHistoryProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null);

  // Calculate payment statistics
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculate amount paid from COMPLETED payments only
  const amountPaid = payments
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + (payment.amount_paid || payment.amount || 0), 0);
  
  // Calculate balance based on contract amount if available
  // If contractAmount is provided, use it for balance calculation, otherwise use totalAmount
  const effectiveTotal = contractAmount || totalAmount;
  
  // Balance is the contract amount minus the amount that has been paid with completed payments
  const balance = effectiveTotal - amountPaid;
  
  // Calculate late fees
  const lateFees = payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);

  // Helper function to determine if a payment was late
  const isLatePayment = (payment: PaymentHistoryItem): boolean => {
    // First check if days_overdue is available and greater than 0
    if (payment.days_overdue && payment.days_overdue > 0) {
      return true;
    }
    
    // If days_overdue is not available, check if there's late_fine_amount
    if (payment.late_fine_amount && payment.late_fine_amount > 0) {
      return true;
    }
    
    // If payment_date and due_date are available, compare them
    if (payment.payment_date && payment.due_date) {
      const paymentDate = new Date(payment.payment_date);
      const dueDate = new Date(payment.due_date);
      return paymentDate > dueDate;
    }
    
    // If payment_date and original_due_date are available, compare them
    if (payment.payment_date && payment.original_due_date) {
      const paymentDate = new Date(payment.payment_date);
      const originalDueDate = new Date(payment.original_due_date);
      return paymentDate > originalDueDate;
    }
    
    // Default to false if we can't determine
    return false;
  };

  // Calculate payment status counts
  const paidOnTime = payments.filter(p => 
    p.status === 'completed' && !isLatePayment(p)
  ).length;
  
  const paidLate = payments.filter(p => 
    p.status === 'completed' && isLatePayment(p)
  ).length;
  
  const unpaid = payments.filter(p => 
    p.status === 'pending' || p.status === 'overdue'
  ).length;

  // Filter payments based on selected status
  const filteredPayments = statusFilter
    ? payments.filter(payment => {
        if (statusFilter === 'completed_ontime') {
          return payment.status === 'completed' && !isLatePayment(payment);
        } else if (statusFilter === 'completed_late') {
          return payment.status === 'completed' && isLatePayment(payment);
        } else {
          return payment.status === statusFilter;
        }
      })
    : payments;

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

  const handleExportHistoryClick = () => {
    try {
      // Format payment data for the PDF export - now with formatted dates (without time)
      const paymentHistoryData = payments.map(payment => {
        return {
          description: payment.description || 'Payment',
          amount: payment.amount || 0,
          dueDate: payment.due_date ? formatDate(payment.due_date, 'MMM d, yyyy') : '',
          paymentDate: payment.payment_date ? formatDate(payment.payment_date, 'MMM d, yyyy') : '',
          status: payment.status || '',
          lateFee: payment.late_fine_amount || 0,
          total: (payment.amount || 0) + (payment.late_fine_amount || 0)
        };
      });

      // Generate the PDF
      const doc = generatePaymentHistoryPdf(
        paymentHistoryData,
        "Payment History"
      );

      // Save the PDF
      doc.save("payment-history.pdf");
      toast.success("Payment history exported successfully");
    } catch (error) {
      console.error("Error exporting payment history:", error);
      toast.error("Failed to export payment history");
    }
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
  ): Promise<boolean> => {
    if (selectedPayment && selectedPayment.id && onPaymentUpdated) {
      try {
        // Calculate if there's a late fee applicable based on the payment date
        let daysOverdue = 0;
        let lateFineAmount = 0;
        
        if (selectedPayment.due_date) {
          const dueDate = new Date(selectedPayment.due_date);
          // Only calculate late fee if payment is made after due date
          if (date > dueDate) {
            // Calculate days late
            daysOverdue = Math.floor((date.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
            // Assume daily_late_fee of 120 if not provided elsewhere
            lateFineAmount = Math.min(daysOverdue * 120, 3000);
          } else {
            // Payment is on time or early, no late fee
            daysOverdue = 0;
            lateFineAmount = 0;
          }
        }
        
        // If amount is zero, set status to voided instead of completed
        const paymentStatus = amount === 0 ? 'voided' : 'completed';
        
        const paymentData: Partial<PaymentHistoryItem> = {
          id: selectedPayment.id,
          amount,
          payment_date: date.toISOString(),
          description: notes,
          payment_method: method,
          transaction_id: reference,
          status: paymentStatus,
          type: paymentType || selectedPayment.type || 'rent',
          days_overdue: daysOverdue,
          late_fine_amount: lateFineAmount,
        };
        
        const success = await onPaymentUpdated(paymentData);
        if (success) {
          toast.success(amount === 0 
            ? "Payment voided successfully" 
            : "Payment updated successfully");
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

  const getFilterLabel = () => {
    switch (statusFilter) {
      case 'completed':
        return 'Completed';
      case 'completed_ontime':
        return 'Paid On Time';
      case 'completed_late':
        return 'Paid Late';  
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return 'All Payments';
    }
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

        <div className="flex justify-between items-center mb-4">
          <PaymentActions 
            rentAmount={rentAmount} 
            onRecordPaymentClick={handleRecordPaymentClick}
            onExportHistoryClick={handleExportHistoryClick}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-2">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? getFilterLabel() : "Filter"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem 
                checked={statusFilter === null}
                onCheckedChange={() => setStatusFilter(null)}
              >
                All Payments
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'completed_ontime'}
                onCheckedChange={() => setStatusFilter('completed_ontime')}
              >
                Paid On Time
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'completed_late'}
                onCheckedChange={() => setStatusFilter('completed_late')}
              >
                Paid Late
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'pending'}
                onCheckedChange={() => setStatusFilter('pending')}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'overdue'}
                onCheckedChange={() => setStatusFilter('overdue')}
              >
                Overdue
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <PaymentTable 
          payments={filteredPayments} 
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
          description={selectedPayment ? "Update payment details or set amount to 0 to void transaction" : "Add a new payment to this agreement"}
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
