import React, { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar, CalendarIcon, Plus, Trash2, FileText, Download, Filter, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { asPaymentId } from '@/utils/type-casting';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { Badge } from '@/components/ui/badge';
import { PaymentEditDialog } from './PaymentEditDialog';
import { Payment, PaymentHistoryProps } from './PaymentHistory.types';

export function PaymentHistory({
  payments = [],
  isLoading = false,
  rentAmount,
  onPaymentDeleted,
  leaseStartDate,
  leaseEndDate,
  onPaymentUpdated,
  onRecordPayment,
}: PaymentHistoryProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<{column: string, direction: 'asc' | 'desc'}>({
    column: 'due_date',
    direction: 'desc'
  });
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleRowClick = (paymentId: string) => {
    setExpandedRowId(prevId => prevId === paymentId ? null : paymentId);
  };

  const paymentStats = useMemo(() => {
    if (!payments.length) {
      return {
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0,
        totalLateFees: 0,
        paidOnTime: 0,
        paidLate: 0,
        unpaid: 0
      };
    }
    
    return payments.reduce((stats, payment) => {
      const totalAmount = payment.amount || 0;
      const lateFee = payment.late_fine_amount || 0;
      const amountPaid = payment.amount_paid || 0;
      const balance = payment.balance || (totalAmount + lateFee - amountPaid);
      const isPaid = payment.status === 'completed';
      const isLate = (payment.days_overdue || 0) > 0;

      return {
        totalAmount: stats.totalAmount + totalAmount,
        totalPaid: stats.totalPaid + amountPaid,
        totalBalance: stats.totalBalance + balance,
        totalLateFees: stats.totalLateFees + lateFee,
        paidOnTime: stats.paidOnTime + (isPaid && !isLate ? 1 : 0),
        paidLate: stats.paidLate + (isPaid && isLate ? 1 : 0),
        unpaid: stats.unpaid + (!isPaid ? 1 : 0)
      };
    }, {
      totalAmount: 0,
      totalPaid: 0,
      totalBalance: 0,
      totalLateFees: 0,
      paidOnTime: 0,
      paidLate: 0,
      unpaid: 0
    });
  }, [payments]);
  
  const sortedPayments = useMemo(() => {
    if (!payments.length) return [];
    
    return [...payments].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy.column) {
        case 'due_date':
          valueA = a.due_date || a.original_due_date || '';
          valueB = b.due_date || b.original_due_date || '';
          break;
        case 'payment_date':
          valueA = a.payment_date || '';
          valueB = b.payment_date || '';
          break;
        case 'amount':
          valueA = a.amount || 0;
          valueB = b.amount || 0;
          break;
        case 'status':
          valueA = a.status || '';
          valueB = b.status || '';
          break;
        default:
          valueA = a.due_date || a.original_due_date || '';
          valueB = b.due_date || b.original_due_date || '';
      }
      
      if (sortBy.column === 'due_date' || sortBy.column === 'payment_date') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }
      
      const direction = sortBy.direction === 'asc' ? 1 : -1;
      return (valueA > valueB ? 1 : -1) * direction;
    });
  }, [payments, sortBy]);

  const handleDelete = useCallback(async (paymentId: string) => {
    try {
      setIsDeleting(paymentId);
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', asPaymentId(paymentId));

      if (error) {
        toast.error(`Failed to delete payment: ${error.message}`);
        return;
      }

      toast.success('Payment deleted successfully');
      onPaymentDeleted();
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(null);
    }
  }, [onPaymentDeleted]);

  const handleSort = (column: string) => {
    setSortBy(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePaymentSubmit = useCallback(async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string,
    includeLatePaymentFee?: boolean
  ) => {
    if (!onRecordPayment) return;
    
    const payment: Partial<Payment> = {
      amount,
      payment_date: paymentDate.toISOString(),
      notes,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      status: 'completed',
      description: notes || 'Payment'
    };
    
    onRecordPayment(payment);
  }, [onRecordPayment]);

  const formatPaymentDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return 'N/A';
    }
  };

  const getStatusBadge = (status?: string, daysOverdue = 0) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'completed') {
      return daysOverdue > 0 
        ? <Badge variant="warning" className="flex items-center gap-1">Paid Late</Badge>
        : <Badge variant="success" className="flex items-center gap-1">Paid</Badge>;
    } 
    if (statusLower === 'overdue' || daysOverdue > 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">Overdue</Badge>;
    }
    if (statusLower === 'pending') {
      return <Badge variant="outline" className="flex items-center gap-1">Pending</Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1">{status || 'Unknown'}</Badge>;
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handlePaymentUpdate = async (updatedPayment: Partial<Payment>) => {
    if (!selectedPayment) return;
    
    try {
      if (onPaymentUpdated) {
        await onPaymentUpdated({
          ...updatedPayment,
          id: selectedPayment.id
        });
        toast.success('Payment updated successfully');
        setIsEditDialogOpen(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    }
  };

  const columns = [
    {
      accessorKey: 'due_date',
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('due_date')}>
          Due Date
          {sortBy.column === 'due_date' && (
            sortBy.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          )}
        </div>
      ),
      cell: ({ row }) => {
        const dueDate = row.original.due_date || row.original.original_due_date;
        return (
          <div 
            className="cursor-pointer hover:text-primary"
            onClick={() => handleRowClick(row.original.id)}
          >
            {dueDate ? formatPaymentDate(dueDate) : 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-gray-700">
          {row.original.description || 'Monthly Rent'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('amount')}>
          Amount
          {sortBy.column === 'amount' && (
            sortBy.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          )}
        </div>
      ),
      cell: ({ row }) => {
        const amount = row.original.amount || 0;
        const lateFee = row.original.late_fine_amount || 0;
        const total = amount + lateFee;
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`font-medium ${lateFee > 0 ? 'text-amber-700' : ''}`}>
                  QAR {total.toLocaleString()}
                </span>
              </TooltipTrigger>
              {lateFee > 0 && (
                <TooltipContent>
                  <p>Base: QAR {amount.toLocaleString()}</p>
                  <p>Late Fee: QAR {lateFee.toLocaleString()}</p>
                  <p>Total: QAR {total.toLocaleString()}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: 'payment_date',
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('payment_date')}>
          Payment Date
          {sortBy.column === 'payment_date' && (
            sortBy.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          )}
        </div>
      ),
      cell: ({ row }) => formatPaymentDate(row.original.payment_date),
    },
    {
      accessorKey: 'status',
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('status')}>
          Status
          {sortBy.column === 'status' && (
            sortBy.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          )}
        </div>
      ),
      cell: ({ row }) => {
        const daysOverdue = row.original.days_overdue || 0;
        return getStatusBadge(row.original.status, daysOverdue);
      },
    },
    {
      id: 'lateFee',
      header: 'Late Fee',
      cell: ({ row }) => {
        const lateFee = row.original.late_fine_amount || 0;
        const daysOverdue = row.original.days_overdue || 0;
        
        return (
          <div>
            {lateFee > 0 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-amber-700 font-medium">
                      QAR {lateFee.toLocaleString()}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{daysOverdue} days overdue</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : <span>-</span>}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEdit(row.original)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit payment</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            disabled={isDeleting === row.original.id}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Track all financial transactions for this agreement</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-3 py-1">
            <CalendarIcon className="h-4 w-4" />
            <span>Monthly Rent: QAR {rentAmount?.toLocaleString() || '0'}</span>
          </div>
          <Button 
            onClick={() => setIsPaymentDialogOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-xl font-semibold">QAR {paymentStats.totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-muted-foreground">Amount Paid</p>
            <p className="text-xl font-semibold text-green-600">QAR {paymentStats.totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-xl font-semibold text-amber-600">QAR {paymentStats.totalBalance.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-muted-foreground">Late Fees</p>
            <p className="text-xl font-semibold text-red-600">QAR {paymentStats.totalLateFees.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="pt-4 space-y-2 hidden md:block">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Payment Status</span>
          </div>
          <div className="flex gap-1">
            <div style={{ width: `${paymentStats.paidOnTime / payments.length * 100}%` }} className="bg-green-500 h-2 rounded-l-full"></div>
            <div style={{ width: `${paymentStats.paidLate / payments.length * 100}%` }} className="bg-amber-500 h-2"></div>
            <div style={{ width: `${paymentStats.unpaid / payments.length * 100}%` }} className="bg-red-500 h-2 rounded-r-full"></div>
          </div>
          <div className="flex justify-between text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span>Paid on Time: {paymentStats.paidOnTime}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
              <span>Paid Late: {paymentStats.paidLate}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
              <span>Unpaid: {paymentStats.unpaid}</span>
            </div>
          </div>
        </div>
      
        {isLoading ? (
          <div className="flex items-center justify-center h-52">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : payments.length > 0 ? (
          <div>
            <DataTable 
              columns={columns} 
              data={sortedPayments} 
            />
            
            {expandedRowId && (
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                {(() => {
                  const payment = payments.find(p => p.id === expandedRowId);
                  if (!payment) return null;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-base font-semibold mb-4">Payment Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base Amount:</span>
                            <span>QAR {payment.amount?.toLocaleString() || '0'}</span>
                          </div>
                          {(payment.late_fine_amount && payment.late_fine_amount > 0) && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Late Fee:</span>
                              <span className="text-amber-700">QAR {payment.late_fine_amount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium border-t pt-2">
                            <span className="text-muted-foreground">Total:</span>
                            <span>QAR {((payment.amount || 0) + (payment.late_fine_amount || 0)).toLocaleString()}</span>
                          </div>
                          {payment.amount_paid !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Amount Paid:</span>
                              <span className="text-green-700">QAR {payment.amount_paid?.toLocaleString()}</span>
                            </div>
                          )}
                          {payment.balance !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Remaining Balance:</span>
                              <span>QAR {payment.balance?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-semibold mb-4">Additional Information</h4>
                        <div className="space-y-2 text-sm">
                          {payment.days_overdue !== undefined && payment.days_overdue > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Days Overdue:</span>
                              <span className="text-red-600">{payment.days_overdue} days</span>
                            </div>
                          )}
                          {payment.payment_method && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment Method:</span>
                              <span>{payment.payment_method}</span>
                            </div>
                          )}
                          {payment.reference_number && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Reference:</span>
                              <span>{payment.reference_number}</span>
                            </div>
                          )}
                          {payment.notes && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Notes:</span>
                              <span>{payment.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            No payment records found for this agreement.
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="outline" size="sm" disabled={payments.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export History
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>All Payments</DropdownMenuItem>
            <DropdownMenuItem>Completed</DropdownMenuItem>
            <DropdownMenuItem>Pending</DropdownMenuItem>
            <DropdownMenuItem>Overdue</DropdownMenuItem>
            <DropdownMenuItem>With Late Fees</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handlePaymentSubmit}
        defaultAmount={rentAmount || 0}
        title="Record Payment"
        description="Enter payment details to record a payment"
      />
      
      {selectedPayment && (
        <PaymentEditDialog
          payment={selectedPayment}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSaved={handlePaymentUpdate}
        />
      )}
    </Card>
  );
}
