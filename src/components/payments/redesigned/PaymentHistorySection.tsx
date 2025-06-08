
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Plus, 
  RefreshCw, 
  DollarSign, 
  Clock,
  Edit,
  MoreHorizontal,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Payment } from '@/types/payment.types';
import { Agreement } from '@/types/agreement';
import { useAgreementPaymentSync } from '@/hooks/payment/use-agreement-payment-sync';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

interface PaymentHistorySectionProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount?: number | null;
  contractAmount?: number | null;
  leaseId?: string;
  onPaymentDeleted: (paymentId: string) => void;
  onRecordPayment: (payment: Partial<Payment>) => Promise<void>;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  showAnalytics?: boolean;
  agreement?: Agreement | null;
  fetchPayments?: () => void;
}

export function PaymentHistorySection({
  payments,
  isLoading,
  rentAmount,
  contractAmount,
  leaseId,
  onRecordPayment,
  onPaymentUpdated,
  onPaymentDeleted,
  showAnalytics = true,
  agreement,
  fetchPayments
}: PaymentHistorySectionProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditLateFeeDialogOpen, setIsEditLateFeeDialogOpen] = useState(false);
  const [newLateFee, setNewLateFee] = useState('');

  const {
    syncAll,
    isPending
  } = useAgreementPaymentSync(leaseId);

  // Compute analytics
  const totalPaid = payments
    .filter(p => ['completed', 'paid'].includes(p.status))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingAmount = payments
    .filter(p => ['pending', 'overdue'].includes(p.status))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const overduePayments = payments.filter(p => p.status === 'overdue');
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');

  const completionRate = payments.length > 0 
    ? (payments.filter(p => ['completed', 'paid'].includes(p.status)).length / payments.length) * 100
    : 0;

  // Utility to call the process-payment edge function
  async function processPartialPayment(paymentId: string, paymentAmount: number) {
    const response = await fetch('/functions/v1/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, paymentAmount }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Payment failed');
    }
    return result.payment;
  }

  // Updated handleRecordPayment to use the edge function
  const handleRecordPayment = async (
    amount: number,
    date: Date,
    notes?: string,
    method?: string,
    reference?: string,
    includeLateFee?: boolean,
    isPartialPayment?: boolean,
    paymentType?: string,
    paymentId?: string
  ) => {
    if (paymentId) {
      try {
        await processPartialPayment(paymentId, amount);
        if (typeof fetchPayments === 'function') {
          fetchPayments();
        } else if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } catch (err) {
        alert('Payment failed: ' + (err instanceof Error ? err.message : err));
        return false;
      }
    } else {
      const newPayment: Partial<Payment> = {
        amount,
        payment_date: date.toISOString(),
        description: notes || '',
        payment_method: method || 'cash',
        reference_number: reference || '',
        lease_id: leaseId,
        status: 'paid'
      };
      await onRecordPayment(newPayment);
    }
    return true;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-QA', {
      style: 'currency',
      currency: 'QAR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Payment History & Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payment history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-6 w-6 text-blue-600" />
              Payment History & Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track payments and financial transactions for this agreement
            </p>
          </div>
          <div className="flex gap-2">
            {leaseId && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncAll}
                disabled={isPending?.all}
                className="bg-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isPending?.all ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setSelectedPayment(null);
                setIsPaymentDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Analytics Overview */}
        {showAnalytics && payments.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Paid</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(totalPaid)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{formatCurrency(pendingAmount)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Overdue</p>
                    <p className="text-2xl font-bold text-red-900">{overduePayments.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Completion</p>
                    <p className="text-2xl font-bold text-blue-900">{completionRate.toFixed(0)}%</p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Progress value={completionRate} className="w-8 h-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments recorded yet</h3>
            <p className="text-muted-foreground mb-4">Start by recording your first payment</p>
            <Button onClick={() => setIsPaymentDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record First Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <div key={payment.id}>
                <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(payment.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-lg">
                            {formatCurrency(payment.amount)}
                          </h4>
                          <Badge variant={getStatusColor(payment.status)}>
                            {payment.status || 'pending'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {payment.payment_method || 'N/A'}
                          </Badge>
                        </div>
                        
                        {payment.payment_date && (
                          <p className="text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Payment Date: {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        
                        {payment.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {payment.description}
                          </p>
                        )}
                        
                        {/* Late Fee Section */}
                        {(() => {
                          if ((payment.status === 'pending' || payment.status === 'overdue') && payment.payment_date) {
                            const today = new Date();
                            const dueDate = new Date(payment.payment_date);
                            const firstOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
                            const daysLate = Math.max(0, differenceInCalendarDays(today, firstOfMonth));
                            const fee = Math.min(daysLate * 120, 3000);
                            return (
                              <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded border border-red-200">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="text-sm text-red-700">
                                  Late Fee: {formatCurrency(payment.late_fine_amount ?? fee)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setNewLateFee(String(payment.late_fine_amount ?? fee));
                                    setIsEditLateFeeDialogOpen(true);
                                  }}
                                  className="text-xs h-6"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            );
                          }
                          
                          if (['completed', 'paid', 'partially_paid'].includes(String(payment.status)) && 
                              payment.late_fine_amount && payment.late_fine_amount > 0) {
                            return (
                              <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded border">
                                <span className="text-sm text-gray-700">
                                  Late Fee Paid: {formatCurrency(payment.late_fine_amount)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setNewLateFee(String(payment.late_fine_amount));
                                    setIsEditLateFeeDialogOpen(true);
                                  }}
                                  className="text-xs h-6"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {payment.status !== 'completed' && payment.status !== 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsPaymentDialogOpen(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Clear Payment
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsPaymentDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onPaymentDeleted(payment.id)}
                          >
                            Delete Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                {index < payments.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          setIsPaymentDialogOpen(open);
          if (!open) setSelectedPayment(null);
        }}
        onSubmit={handleRecordPayment}
        defaultAmount={selectedPayment ? selectedPayment.amount : rentAmount || 0}
        title="Record Payment"
        description={selectedPayment ? "Clear this payment" : "Add a new payment to this agreement"}
        leaseId={leaseId || ''}
        rentAmount={rentAmount}
        selectedPayment={selectedPayment}
        pendingPayments={pendingPayments}
      />

      {/* Edit Late Fee Dialog */}
      <Dialog open={isEditLateFeeDialogOpen} onOpenChange={setIsEditLateFeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Late Fee</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (selectedPayment && newLateFee !== '') {
                await onPaymentUpdated({
                  id: selectedPayment.id,
                  late_fine_amount: Number(newLateFee),
                });
                setIsEditLateFeeDialogOpen(false);
                setSelectedPayment(null);
              }
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="lateFee">Late Fee (QAR)</Label>
                <Input
                  id="lateFee"
                  type="number"
                  value={newLateFee}
                  onChange={(e) => setNewLateFee(e.target.value)}
                  min={0}
                  step={1}
                  required
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">Save Changes</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditLateFeeDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
