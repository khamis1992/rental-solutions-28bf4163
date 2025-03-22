
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { PaymentEditDialog } from "./PaymentEditDialog";
import { Edit, AlertCircle, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Payment {
  id: string;
  amount: number;
  payment_date: string | Date;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number | null;
  days_overdue?: number | null;
  lease_id?: string;
}

export interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount?: number | null;
  onPaymentDeleted?: () => void;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ 
  payments, 
  isLoading, 
  rentAmount,
  onPaymentDeleted 
}) => {
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleDeletePayment = (payment: Payment) => {
    setPaymentToDelete(payment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("unified_payments")
        .delete()
        .eq("id", paymentToDelete.id);
      
      if (error) throw error;
      
      toast.success("Payment deleted successfully");
      setIsDeleteDialogOpen(false);
      
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

  const calculatePendingPayments = () => {
    if (!rentAmount) return 0;
    
    const pendingPayments = payments.filter(
      payment => payment.type === "rent" && payment.status === "pending"
    );
    
    return pendingPayments.reduce((total, payment) => total + payment.amount, 0);
  };

  const pendingAmount = calculatePendingPayments();

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case "paid":
      case "completed":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return null;
    
    switch (method.toLowerCase()) {
      case "cash":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cash</Badge>;
      case "credit_card":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Credit Card</Badge>;
      case "debit_card":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Debit Card</Badge>;
      case "bank_transfer":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Bank Transfer</Badge>;
      case "check":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Check</Badge>;
      case "mobile_payment":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Mobile Payment</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View and manage payment records</CardDescription>
          </div>
          {pendingAmount > 0 && rentAmount && (
            <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>Pending payments totaling {formatCurrency(pendingAmount)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : payments.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {typeof payment.payment_date === 'string' 
                        ? format(new Date(payment.payment_date), "PP") 
                        : format(payment.payment_date, "PP")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                      {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="destructive" className="ml-2">+Fine</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Includes late fine: {formatCurrency(payment.late_fine_amount)}</p>
                              {payment.days_overdue && (
                                <p>{payment.days_overdue} days overdue</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.type === "rent" ? "Monthly Rent" : 
                       payment.type === "deposit" ? "Security Deposit" : 
                       payment.type === "fee" ? "Fee" : 
                       payment.type || "Other"}
                    </TableCell>
                    <TableCell>{getPaymentMethodBadge(payment.payment_method)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="w-full text-left">
                            <span className="block truncate">{payment.notes || "-"}</span>
                          </TooltipTrigger>
                          {payment.notes && (
                            <TooltipContent className="max-w-[300px]">
                              <p className="whitespace-normal">{payment.notes}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditPayment(payment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                        
                        {payment.status === "pending" && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeletePayment(payment)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">No payment records found</p>
          </div>
        )}
      </CardContent>

      <PaymentEditDialog 
        payment={editingPayment}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={() => {
          setIsEditDialogOpen(false);
          // We would normally refresh payments here, but that's handled by the parent component
        }}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {paymentToDelete?.status} payment of {paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePayment}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
