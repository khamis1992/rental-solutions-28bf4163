
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Payment } from '@/types/payment-history.types';
import { PaymentTable } from '../table/PaymentTable';
import { PaymentStatusBar } from '../status/PaymentStatusBar';
import { PaymentStatsCards } from '../stats/PaymentStatsCards';
import { PaymentFilterBar } from './PaymentFilterBar';
import { PaymentActionsBar } from './PaymentActionsBar';
import { PaymentLoadingState } from './PaymentLoadingState';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface PaymentHistorySectionProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount?: number | null;
  leaseId?: string;
  onPaymentDeleted?: (paymentId: string) => void;
  onPaymentUpdated?: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment?: (payment: Partial<Payment>) => void;
  showAnalytics?: boolean;
}

export function PaymentHistorySection({
  payments,
  isLoading,
  rentAmount,
  leaseId,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  showAnalytics = false
}: PaymentHistorySectionProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);

  // Sort and filter payments
  useEffect(() => {
    if (!payments) return;
    
    // Sort by date (newest first)
    let sorted = [...payments].sort((a, b) => 
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
    
    // Apply status filter if set
    if (statusFilter) {
      sorted = sorted.filter(payment => {
        switch (statusFilter) {
          case 'completed':
            return payment.status === 'completed';
          case 'completed_ontime':
            return payment.status === 'completed' && !payment.is_late;
          case 'completed_late':
            return payment.status === 'completed' && payment.is_late;
          case 'pending':
            return payment.status === 'pending';
          case 'overdue':
            return payment.status === 'pending' && payment.is_overdue;
          default:
            return true;
        }
      });
    }
    
    setFilteredPayments(sorted);
  }, [payments, statusFilter]);

  const handleRecordPaymentClick = () => {
    if (onRecordPayment) {
      // Create a new payment object with default values
      const newPayment = {
        lease_id: leaseId,
        payment_amount: rentAmount || 0,
        status: 'pending',
        payment_date: new Date().toISOString(),
      };
      
      onRecordPayment(newPayment);
    }
  };

  const handleDeleteClick = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (payment: Payment) => {
    setPaymentToEdit(payment);
    setIsPaymentSheetOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (paymentToDelete && onPaymentDeleted) {
      onPaymentDeleted(paymentToDelete);
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  const handleUpdatePayment = async (updatedPayment: Partial<Payment>) => {
    if (onPaymentUpdated && paymentToEdit) {
      const success = await onPaymentUpdated({
        id: paymentToEdit.id,
        ...updatedPayment
      });
      
      if (success) {
        setIsPaymentSheetOpen(false);
        setPaymentToEdit(null);
        return true;
      }
      return false;
    }
    return false;
  };

  // Calculate payment statistics
  const paymentStats = React.useMemo(() => {
    if (!payments?.length) {
      return {
        total: 0,
        paid: 0,
        pending: 0,
        late: 0,
        overdue: 0,
      };
    }

    return payments.reduce((stats, payment) => {
      stats.total++;
      
      if (payment.status === 'completed') {
        stats.paid++;
        if (payment.is_late) {
          stats.late++;
        }
      }
      
      if (payment.status === 'pending') {
        stats.pending++;
        if (payment.is_overdue) {
          stats.overdue++;
        }
      }
      
      return stats;
    }, { total: 0, paid: 0, pending: 0, late: 0, overdue: 0 });
  }, [payments]);

  return (
    <div className="space-y-4">
      {showAnalytics && (
        <>
          <PaymentStatusBar 
            totalPayments={paymentStats.total}
            completedPayments={paymentStats.paid}
            pendingPayments={paymentStats.pending}
            overduePayments={paymentStats.overdue}
          />
          <PaymentStatsCards 
            totalPayments={paymentStats.total}
            paidPayments={paymentStats.paid}
            pendingPayments={paymentStats.pending}
            latePayments={paymentStats.late}
            overduePayments={paymentStats.overdue}
            payments={payments}
          />
        </>
      )}

      <Card>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Payment History</h3>
            <div className="flex items-center space-x-2">
              <PaymentFilterBar 
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
              {rentAmount !== undefined && rentAmount !== null && (
                <PaymentActionsBar 
                  rentAmount={rentAmount} 
                  onRecordPaymentClick={handleRecordPaymentClick} 
                />
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <PaymentLoadingState />
          ) : filteredPayments.length > 0 ? (
            <PaymentTable 
              payments={filteredPayments} 
              onDeleteClick={onPaymentDeleted ? handleDeleteClick : undefined}
              onEditClick={onPaymentUpdated ? handleEditClick : undefined}
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No payment records found.</p>
              {statusFilter && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try changing your filter settings.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Payment Sheet */}
      <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Payment</SheetTitle>
          </SheetHeader>
          {paymentToEdit && (
            <div className="py-4">
              <p>Edit payment form would go here.</p>
              {/* Edit payment form would go here */}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
