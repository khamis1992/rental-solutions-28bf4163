
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PaymentEditDialog } from "./PaymentEditDialog";

export type Payment = {
  id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
};

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount?: number | null;
  onPaymentDeleted?: () => void;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
}

const getPaymentStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-300";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "overdue":
      return "bg-red-100 text-red-800 border-red-300";
    case "partial":
      return "bg-blue-100 text-blue-800 border-blue-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ 
  payments, 
  isLoading, 
  rentAmount,
  onPaymentDeleted,
  leaseStartDate,
  leaseEndDate
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleOpenEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    setIsEditDialogOpen(false);
    setEditingPayment(null);
    // Trigger a refresh of payment data
    if (onPaymentDeleted) {
      onPaymentDeleted();
    }
  };

  const deletePayment = async (paymentId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentId);

      if (error) {
        throw error;
      }

      toast.success("Payment deleted successfully");
      
      // Call the callback to refresh payment data
      if (onPaymentDeleted) {
        onPaymentDeleted();
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
      setPaymentToDelete(null);
    }
  };

  const getTotalPaid = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  const calculateTotalDue = () => {
    if (!rentAmount || !leaseStartDate || !leaseEndDate) return 0;
    
    const months = Math.max(1, Math.ceil(
      (leaseEndDate.getTime() - leaseStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
    ));
    
    return rentAmount * months;
  };

  const totalPaid = getTotalPaid();
  const totalDue = calculateTotalDue();
  const remainingBalance = totalDue - totalPaid;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Loading payment records...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Record of all payments for this agreement</CardDescription>
        </div>
        <div className="flex flex-col items-start sm:items-end space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Total Paid:</span>
            <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
          </div>
          {rentAmount && leaseStartDate && leaseEndDate && (
            <>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Total Due:</span>
                <span className="font-bold">{formatCurrency(totalDue)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Remaining Balance:</span>
                <span className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div 
                key={payment.id} 
                className="flex flex-col sm:flex-row justify-between p-4 border rounded-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    {payment.status && (
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {payment.payment_date ? format(
                      typeof payment.payment_date === 'string' ? parseISO(payment.payment_date) : new Date(payment.payment_date),
                      "PPP"
                    ) : "N/A"}
                  </p>
                  {payment.payment_method && (
                    <p className="text-sm text-muted-foreground">
                      Method: {payment.payment_method}
                      {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                    </p>
                  )}
                  {payment.notes && <p className="text-sm text-muted-foreground">{payment.notes}</p>}
                  {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                    <p className="text-sm text-red-600">
                      Includes late fee: {formatCurrency(payment.late_fine_amount)}
                      {payment.days_overdue && payment.days_overdue > 0 ? ` (${payment.days_overdue} days overdue)` : ''}
                    </p>
                  )}
                </div>
                <div className="flex mt-2 sm:mt-0 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(payment)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog open={paymentToDelete === payment.id} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentToDelete(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the payment record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePayment(payment.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6 text-muted-foreground">
            No payment records found for this agreement.
          </p>
        )}
      </CardContent>

      {/* Payment Edit Dialog */}
      {editingPayment && (
        <PaymentEditDialog 
          payment={editingPayment}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)} 
          onComplete={handleEditComplete}
        />
      )}
    </Card>
  );
};
