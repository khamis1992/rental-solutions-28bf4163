
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useUnifiedPayments, Payment, MissingPayment } from '@/hooks/use-unified-payments';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Clock, Edit, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UnifiedPaymentListProps {
  agreementId: string;
  rentAmount?: number | null;
  leaseStartDate?: string | Date;
  leaseEndDate?: string | Date;
  onPaymentDeleted?: () => void;
  onEditPayment?: (payment: Payment) => void;
  showAsMissingOnly?: boolean;
}

export function UnifiedPaymentList({ 
  agreementId, 
  rentAmount = null,
  leaseStartDate,
  leaseEndDate,
  onPaymentDeleted,
  onEditPayment,
  showAsMissingOnly = false
}: UnifiedPaymentListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { 
    payments, 
    isLoading, 
    error, 
    deletePayment, 
    missingPayments,
    pendingAmount 
  } = useUnifiedPayments({
    agreementId,
    rentAmount,
    leaseStartDate,
    leaseEndDate
  });

  const confirmDeletePayment = (id: string) => {
    setPaymentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setIsDeleting(true);
    
    try {
      const success = await deletePayment(paymentToDelete);
      if (success) {
        setIsDeleteDialogOpen(false);
        if (onPaymentDeleted) {
          onPaymentDeleted();
        }
      }
    } finally {
      setIsDeleting(false);
      setPaymentToDelete(null);
    }
  };

  const renderPaymentMethodBadge = (method: string) => {
    switch(method.toLowerCase()) {
      case 'cash':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Cash</Badge>;
      case 'credit_card':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Credit Card</Badge>;
      case 'bank_transfer':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Bank Transfer</Badge>;
      case 'cheque':
      case 'check':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Cheque</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{method}</Badge>;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-500 text-white">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Render missing payments section
  const renderMissingPayments = () => {
    if (missingPayments.length === 0) return null;
    
    return (
      <div className="mb-6 bg-red-50 border border-red-100 rounded-md p-4">
        <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Missing Payments
        </h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {missingPayments.map((payment, index) => (
            <div key={index} className="bg-white p-3 border border-red-100 rounded-md">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{payment.formattedDate}</div>
                  {rentAmount && (
                    <div className="font-semibold">{formatCurrency(rentAmount)}</div>
                  )}
                </div>
                <div className="text-right">
                  {payment.daysOverdue > 0 && (
                    <>
                      <div className="text-amber-600 text-sm">
                        {payment.daysOverdue} {payment.daysOverdue === 1 ? 'day' : 'days'} overdue
                      </div>
                      <div className="text-red-600 text-sm">
                        + {formatCurrency(payment.lateFineAmount)} fine
                      </div>
                      <div className="font-bold text-red-700 mt-1">
                        Total: {formatCurrency((rentAmount || 0) + payment.lateFineAmount)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <AlertCircle className="mb-2 h-10 w-10 text-red-500" />
        <h3 className="text-lg font-medium">Error loading payments</h3>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  // If we're only showing missing payments
  if (showAsMissingOnly) {
    return renderMissingPayments();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View and manage payment records</CardDescription>
          </div>
          <div className="flex gap-2">
            {pendingAmount > 0 && (
              <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>Pending payments: {formatCurrency(pendingAmount)}</span>
              </div>
            )}
            {missingPayments.length > 0 && (
              <div className="bg-red-50 text-red-800 px-4 py-2 rounded-md flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Missing {missingPayments.length} payment{missingPayments.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderMissingPayments()}

        {payments.length > 0 ? (
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
                    <TableCell>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</TableCell>
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
                      <span className="capitalize">
                        {payment.type === "rent" ? "Monthly Rent" : 
                        payment.type === "deposit" ? "Security Deposit" : 
                        payment.type === "fee" ? "Fee" : 
                        payment.type || "Other"}
                      </span>
                    </TableCell>
                    <TableCell>{renderPaymentMethodBadge(payment.payment_method || 'cash')}</TableCell>
                    <TableCell>{renderStatusBadge(payment.status || 'pending')}</TableCell>
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
                        {onEditPayment && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onEditPayment(payment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {payment.status !== 'cancelled' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => confirmDeletePayment(payment.id)}
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
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <AlertCircle className="mb-2 h-10 w-10" />
            <h3 className="text-lg font-medium">No payments found</h3>
            <p className="mt-1">No payment records exist for this agreement.</p>
          </div>
        )}
      </CardContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePayment}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
