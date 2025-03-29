
import React, { useState } from 'react';
import { Payment } from '@/components/agreements/PaymentHistory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format, differenceInDays, isBefore } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Trash2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentListProps {
  payments: Payment[];
  isLoading: boolean;
  onPaymentDeleted: () => void;
  rentAmount?: number | null;
  leaseStartDate?: Date | string;
  leaseEndDate?: Date | string;
}

export const PaymentList = ({ 
  payments, 
  isLoading, 
  onPaymentDeleted,
  rentAmount,
  leaseStartDate,
  leaseEndDate 
}: PaymentListProps) => {
  const [paymentBeingDeleted, setPaymentBeingDeleted] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

  const handleDeletePayment = async (paymentId: string) => {
    try {
      setPaymentBeingDeleted(paymentId);
      
      // Delete the payment from the unified_payments table
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentId);
        
      if (error) {
        console.error("Error deleting payment:", error);
        toast.error("Failed to delete payment");
        return;
      }
      
      toast.success("Payment deleted successfully");
      if (onPaymentDeleted) {
        onPaymentDeleted();
      }
    } catch (error) {
      console.error("Error in payment deletion:", error);
      toast.error("An unexpected error occurred while deleting payment");
    } finally {
      setPaymentBeingDeleted(null);
    }
  };

  const handleMarkAsPaid = async (payment: Payment) => {
    try {
      setIsProcessingPayment(payment.id);
      
      // Update the payment record to mark it as paid
      const { error } = await supabase
        .from('unified_payments')
        .update({
          status: 'paid',
          amount_paid: payment.amount,
          balance: 0,
          payment_method: 'cash', // Default to cash
          payment_date: new Date().toISOString() // Set to current date
        })
        .eq('id', payment.id);
        
      if (error) {
        console.error("Error marking payment as paid:", error);
        toast.error("Failed to process payment");
        return;
      }
      
      toast.success("Payment processed successfully");
      if (onPaymentDeleted) {
        onPaymentDeleted(); // Use the same callback to refresh the list
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("An unexpected error occurred while processing payment");
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const getPaymentStatusBadge = (payment: Payment) => {
    const status = payment.status?.toLowerCase();
    
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      case 'partial':
        return <Badge className="bg-blue-500">Partial</Badge>;
      default:
        return <Badge className="bg-gray-500">{status || 'Unknown'}</Badge>;
    }
  };

  // Function to check if a payment date is in the past
  const isOverdue = (paymentDate: string | Date) => {
    const today = new Date();
    const date = new Date(paymentDate);
    return isBefore(date, today) && differenceInDays(today, date) > 0;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Loading payment history...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No payment records found for this agreement.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {format(new Date(payment.payment_date), 'PPP')}
                    {payment.status === 'pending' && isOverdue(payment.payment_date) && (
                      <div className="mt-1 flex items-center text-xs text-red-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {differenceInDays(new Date(), new Date(payment.payment_date))} days overdue
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(payment)}
                  </TableCell>
                  <TableCell>
                    {payment.payment_method ? 
                      payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1) : 
                      'Not specified'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {payment.notes}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkAsPaid(payment)}
                          disabled={isProcessingPayment === payment.id}
                        >
                          {isProcessingPayment === payment.id ? (
                            <>Processing...</>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Mark as Paid
                            </>
                          )}
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={paymentBeingDeleted === payment.id}
                          >
                            {paymentBeingDeleted === payment.id ? (
                              <>Deleting...</>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Payment Record</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this payment record? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeletePayment(payment.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
