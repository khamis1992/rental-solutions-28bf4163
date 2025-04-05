
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { usePayments } from '@/hooks/use-payments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { differenceInDays } from 'date-fns';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  type: string;
  status: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id: string;
}

interface PaymentListProps {
  agreementId: string;
  onPaymentDeleted: () => void;
}

export function PaymentList({ agreementId, onPaymentDeleted }: PaymentListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [missingPayments, setMissingPayments] = useState<any[]>([]);
  const initialFetchDone = useRef(false);
  const isDeleting = useRef(false);
  const refreshDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { payments, isLoadingPayments, fetchPayments } = usePayments(agreementId, null);

  useEffect(() => {
    if (agreementId && !initialFetchDone.current) {
      console.log("Initial payment fetch in PaymentList for:", agreementId);
      fetchPayments(true);
      initialFetchDone.current = true;
    }
  }, [agreementId, fetchPayments]);

  useEffect(() => {
    const calculateMissingPayments = async () => {
      try {
        const { data: lease, error } = await supabase
          .from('leases')
          .select('start_date, rent_amount')
          .eq('id', agreementId)
          .single();
          
        if (error || !lease) {
          console.error("Error fetching lease details:", error);
          return;
        }
        
        const today = new Date();
        const startDate = new Date(lease.start_date);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const { data: currentMonthPayment } = await supabase
          .from('unified_payments')
          .select('id')
          .eq('lease_id', agreementId)
          .gte('payment_date', new Date(currentYear, currentMonth, 1).toISOString())
          .lt('payment_date', new Date(currentYear, currentMonth + 1, 0).toISOString());
          
        if (currentMonthPayment && currentMonthPayment.length > 0) {
          setMissingPayments([]);
          return;
        }
        
        const dueDate = new Date(currentYear, currentMonth, 1);
        const daysOverdue = differenceInDays(today, dueDate);
        const dailyLateFee = 120;
        const lateFee = Math.min(daysOverdue * dailyLateFee, 3000);
        
        if (daysOverdue > 0) {
          setMissingPayments([{
            month: today.toLocaleString('default', { month: 'long', year: 'numeric' }),
            amount: lease.rent_amount || 0,
            daysOverdue: daysOverdue,
            lateFee: lateFee,
            totalDue: (lease.rent_amount || 0) + lateFee
          }]);
        } else {
          setMissingPayments([]);
        }
      } catch (err) {
        console.error("Error calculating missing payments:", err);
      }
    };
    
    if (agreementId && initialFetchDone.current) {
      calculateMissingPayments();
    }
  }, [agreementId, payments]);

  // Debounced refresh to prevent multiple rapid refreshes
  const debouncedRefresh = () => {
    if (refreshDebounceTimer.current) {
      clearTimeout(refreshDebounceTimer.current);
    }
    
    refreshDebounceTimer.current = setTimeout(() => {
      console.log("Running debounced payment refresh in PaymentList");
      fetchPayments(true);
      onPaymentDeleted();
      refreshDebounceTimer.current = null;
    }, 500);
  };

  const confirmDeletePayment = (id: string) => {
    setPaymentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete || isDeleting.current) return;

    try {
      isDeleting.current = true;
      
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentToDelete);

      if (error) {
        console.error("Error deleting payment:", error);
        toast.error("Failed to delete payment");
        return;
      }

      toast.success("Payment deleted successfully");
      setIsDeleteDialogOpen(false);
      
      // Use debounced refresh to prevent multiple refreshes
      debouncedRefresh();
      
    } catch (error) {
      console.error("Error in payment deletion:", error);
      toast.error("An unexpected error occurred");
    } finally {
      isDeleting.current = false;
    }
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (refreshDebounceTimer.current) {
        clearTimeout(refreshDebounceTimer.current);
      }
    };
  }, []);

  const renderPaymentMethodBadge = (method: string) => {
    switch(method.toLowerCase()) {
      case 'cash':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cash</Badge>;
      case 'credit_card':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Credit Card</Badge>;
      case 'bank_transfer':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Bank Transfer</Badge>;
      case 'debit_card':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Debit Card</Badge>;
      case 'check':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Check</Badge>;
      case 'mobile_payment':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Mobile Payment</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and manage payment records</CardDescription>
        </div>
        {missingPayments.length > 0 && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Missing {missingPayments.length} payment{missingPayments.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoadingPayments ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            {missingPayments.length > 0 && (
              <div className="mb-6 border border-red-200 rounded-md p-4 bg-red-50">
                <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Missing Payments
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {missingPayments.map((item, index) => (
                    <div key={index} className="bg-white text-red-700 border border-red-200 px-3 py-2 rounded text-sm">
                      <div className="font-medium">{item.month}</div>
                      <div className="font-semibold">{formatCurrency(item.amount)}</div>
                      {item.daysOverdue > 0 && (
                        <div className="mt-1 text-xs">
                          <div className="text-amber-700">
                            {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'} overdue
                          </div>
                          <div className="text-red-600 font-medium">
                            + {formatCurrency(item.lateFee)} fine
                          </div>
                          <div className="mt-1 font-bold text-red-700">
                            Total: {formatCurrency(item.totalDue)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
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
                        <TableCell>{renderPaymentMethodBadge(payment.payment_method)}</TableCell>
                        <TableCell>{renderStatusBadge(payment.status)}</TableCell>
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
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {payment.status.toLowerCase() !== 'paid' && payment.status.toLowerCase() !== 'completed' && (
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
          </>
        )}
      </CardContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePayment}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
