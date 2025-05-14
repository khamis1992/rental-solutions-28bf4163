
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Payment } from '@/types/payment.types';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { PaymentStatsCards } from './stats/PaymentStatsCards';
import { PaymentStatusBar } from './status/PaymentStatusBar';
import { PaymentTable } from './table/PaymentTable';
import { PaymentActions, PaymentTableActions } from './actions/PaymentActions';
import { EmptyPaymentState } from './empty/EmptyPaymentState';
import { PaymentAnalytics } from './analytics/PaymentAnalytics';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Filter, AlertTriangle } from 'lucide-react';
import { generatePaymentHistoryPdf } from '@/utils/report-utils';
import { formatDate } from '@/lib/date-utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePaymentManagement } from '@/hooks/payment/use-payment-management';
import { usePaymentCalculation } from '@/hooks/payment/use-payment-calculation';
import { usePaymentQuery } from '@/hooks/use-payment-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentHistoryProps {
  payments?: Payment[];
  isLoading?: boolean;
  rentAmount?: number | null;
  leaseId?: string;
  contractAmount?: number | null;
  onPaymentDeleted?: (paymentId: string) => void;
  onPaymentUpdated?: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment?: (payment: Partial<Payment>) => void;
  showAnalytics?: boolean;
  // Added for standalone usage without parent passing payments
  useExternalData?: boolean;
}

export function PaymentHistorySection({
  payments = [],
  isLoading: externalIsLoading,
  rentAmount,
  leaseId,
  contractAmount = null,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  showAnalytics = true,
  useExternalData = false
}: PaymentHistoryProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Use React Query hooks for payments data
  const {
    getAgreementPayments,
    createPayment,
    updatePayment: updatePaymentMutation,
    deletePayment: deletePaymentMutation,
    getPaymentStatistics
  } = usePaymentQuery();

  // Get payments data from React Query if not using external data
  const paymentsQuery = !useExternalData && leaseId ? 
    getAgreementPayments(leaseId) : 
    { data: null, isLoading: false, error: null };
  
  // Get payment statistics
  const statisticsQuery = !useExternalData && leaseId ?
    getPaymentStatistics(leaseId) :
    { data: null, isLoading: false, error: null };

  // Determine which data source to use
  const paymentData = useExternalData ? payments : (paymentsQuery.data?.data || []);
  const isLoading = useExternalData ? externalIsLoading : paymentsQuery.isLoading;
  const error = !useExternalData ? paymentsQuery.error : null;

  // Use the payment management hook
  const {
    statusFilter,
    setStatusFilter,
    getFilterLabel,
    isLatePayment
  } = usePaymentManagement(leaseId);
  
  // Use the payment calculation hook
  const {
    totalAmount,
    amountPaid,
    balance,
    lateFees
  } = usePaymentCalculation(paymentData, contractAmount);
    // Calculate payment status counts
  const paidOnTime = paymentData.filter(p => 
    p.status === 'completed' && !isLatePayment(p)
  ).length;
  
  const paidLate = paymentData.filter(p => 
    p.status === 'completed' && isLatePayment(p)
  ).length;
  
  const unpaid = paymentData.filter(p => 
    p.status === 'pending' || p.status === 'overdue'
  ).length;

  // Filter payments based on selected status
  const filteredPayments = statusFilter
    ? paymentData.filter(payment => {
        if (statusFilter === 'completed_ontime') {
          return payment.status === 'completed' && !isLatePayment(payment);
        } else if (statusFilter === 'completed_late') {
          return payment.status === 'completed' && isLatePayment(payment);
        } else {
          return payment.status === statusFilter;
        }
      })
    : paymentData;
  const handlePaymentCreated = (payment: Partial<Payment>) => {
    if (useExternalData && onRecordPayment) {
      // Use external handler if provided
      onRecordPayment(payment);
      setIsPaymentDialogOpen(false);
    } else if (leaseId) {
      // Use React Query mutation
      const createPaymentMutation = createPayment();
      createPaymentMutation.mutate(payment, {
        onSuccess: () => {
          setIsPaymentDialogOpen(false);
          toast.success("Payment recorded successfully");
        },
        onError: (error) => {
          toast.error("Failed to record payment");
          console.error("Error creating payment:", error);
        }
      });
    }
  };

  const handleEditPayment = (payment: Payment) => {
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
      const paymentHistoryData = paymentData.map(payment => {
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
    // Confirm deletion with the user
    if (window.confirm('Are you sure you want to delete this payment?')) {
      if (useExternalData && onPaymentDeleted) {
        // Use external handler if provided
        onPaymentDeleted(paymentId);
      } else if (leaseId) {
        // Use React Query mutation
        const deletePayment = deletePaymentMutation();
        deletePayment.mutate(
          { id: paymentId, agreementId: leaseId },
          {
            onSuccess: () => {
              toast.success("Payment deleted successfully");
            },
            onError: (error) => {
              toast.error("Failed to delete payment");
              console.error("Error deleting payment:", error);
            }
          }
        );
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
    if (selectedPayment && selectedPayment.id) {
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
        
        const paymentData: Partial<Payment> = {
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
        
        if (useExternalData && onPaymentUpdated) {
          // Use external handler if provided
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
        } else {
          // Use React Query mutation
          const updatePayment = updatePaymentMutation();
          await updatePayment.mutateAsync({ id: selectedPayment.id, data: paymentData });
          toast.success(amount === 0 
            ? "Payment voided successfully" 
            : "Payment updated successfully");
          setIsPaymentDialogOpen(false);
          return true;
        }
      } catch (error) {
        console.error("Error updating payment:", error);
        toast.error("Failed to update payment");
        return false;
      }
    } else if (leaseId) {
      if (useExternalData && onRecordPayment) {
        // Use external handler if provided
        const paymentData: Partial<Payment> = {
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
      } else {
        // Use React Query mutation - process special payment
        try {
          const processSpecialPayment = usePaymentQuery().processSpecialPayment();
          await processSpecialPayment.mutateAsync({
            agreementId: leaseId,
            amount,
            paymentDate: date,
            options: {
              notes,
              paymentMethod: method,
              referenceNumber: reference,
              includeLatePaymentFee,
              isPartialPayment: isPartial,
              paymentType: paymentType || 'rent'
            }
          });
          toast.success("Payment recorded successfully");
          setIsPaymentDialogOpen(false);
          return true;
        } catch (error) {
          console.error("Error creating payment:", error);
          toast.error("Failed to record payment");
          return false;
        }
      }
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

    if (error) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            There was an error loading payment data. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }

    if (paymentData.length === 0) {
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
          totalPayments={paymentData.length} 
        />

        <div className="flex justify-between items-center mb-4">
          <PaymentActions 
            rentAmount={rentAmount || 0} 
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
          rentAmount={rentAmount || 0}
          selectedPayment={selectedPayment}
        />
      )}
      
      {/* Only render the analytics section if showAnalytics is true and we have data */}
      {showAnalytics && !isLoading && !error && (
        <PaymentAnalytics
          amountPaid={amountPaid}
          balance={balance}
          lateFees={lateFees}
          statistics={!useExternalData ? statisticsQuery.data : undefined}
        />
      )}
    </div>
  );
}
