import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Payment } from '@/types/payment.types';
import { Agreement } from '@/types/agreement';
import { useAgreementPaymentSync } from '@/hooks/payment/use-agreement-payment-sync';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  // Compute pending/overdue payments for the dialog
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');

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
        // Optionally, show a success message
        if (typeof fetchPayments === 'function') {
          fetchPayments();
        } else if (typeof window !== 'undefined') {
          window.location.reload(); // fallback: reload page
        }
      } catch (err) {
        alert('Payment failed: ' + (err instanceof Error ? err.message : err));
        return false;
      }
    } else {
      // Fallback: create a new payment (if needed)
      const newPayment: Partial<Payment> = {
        amount,
        payment_date: date.toISOString(),
        description: notes || '',
        payment_method: method || 'cash',
        reference_number: reference || '',
        lease_id: leaseId,
        status: 'paid' // Fix: use valid status
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>سجل المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">جاري تحميل سجل المدفوعات...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-row-reverse" dir="rtl">
          <CardTitle>سجل المدفوعات</CardTitle>
          <div className="flex gap-2 flex-row-reverse">
            {leaseId && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncAll}
                disabled={isPending?.all}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${isPending?.all ? 'animate-spin' : ''}`} />
                مزامنة المدفوعات
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setSelectedPayment(null);
                setIsPaymentDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 ml-2" />
              تسجيل دفعة
            </Button>
          </div>
        </div>
        <div className="text-muted-foreground text-sm mt-1 text-right" dir="rtl">
          تتبع المدفوعات والمعاملات المالية لهذا العقد
        </div>
      </CardHeader>
      
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد مدفوعات مسجلة بعد
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                dir="rtl"
              >
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {formatCurrency(payment.amount)} ر.ق
                    </div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      الاستحقاق: 1 من كل شهر
                    </div>
                    
                    {(() => {
                      // Show dynamic late fee for pending/overdue
                      if ((payment.status === 'pending' || payment.status === 'overdue') && payment.payment_date) {
                        const today = new Date();
                        const dueDate = new Date(payment.payment_date);
                        const firstOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
                        const daysLate = Math.max(0, differenceInCalendarDays(today, firstOfMonth));
                        const fee = Math.min(daysLate * 120, 3000);
                        return (
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <div className="text-xs text-red-600 mt-1">
                              رسوم التأخير: {formatCurrency(payment.late_fine_amount ?? fee)} ر.ق
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setNewLateFee(String(payment.late_fine_amount ?? fee));
                                setIsEditLateFeeDialogOpen(true);
                              }}
                            >
                              تعديل
                            </Button>
                          </div>
                        );
                      }
                      // Show static late_fine_amount for paid/completed/partially_paid
                      if ((['completed', 'paid', 'partially_paid'].includes(payment.status)) && payment.late_fine_amount && payment.late_fine_amount > 0) {
                        return (
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <div className="text-xs text-red-600 mt-1">
                              رسوم التأخير: {formatCurrency(payment.late_fine_amount)} ر.ق
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setNewLateFee(String(payment.late_fine_amount));
                                setIsEditLateFeeDialogOpen(true);
                              }}
                            >
                              تعديل
                            </Button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {payment.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {payment.description}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  {payment.status !== 'paid' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsPaymentDialogOpen(true);
                      }}
                    >
                      تسوية
                    </Button>
                  )}
                </div>
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
        title="تسجيل دفعة"
        description={selectedPayment ? "تسوية هذه الدفعة" : "إضافة دفعة جديدة لهذا العقد"}
        leaseId={leaseId || ''}
        rentAmount={rentAmount}
        selectedPayment={selectedPayment}
      />

      {/* Edit Late Fee Dialog */}
      <Dialog open={isEditLateFeeDialogOpen} onOpenChange={setIsEditLateFeeDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>تعديل رسوم التأخير</DialogTitle>
            <DialogDescription className="text-right">
              قم بتحديث مبلغ رسوم التأخير لهذه الدفعة
            </DialogDescription>
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
            <Label className="text-right block">رسوم التأخير (ر.ق)</Label>
            <Input
              type="number"
              value={newLateFee}
              onChange={(e) => setNewLateFee(e.target.value)}
              min={0}
              step={1}
              required
              className="text-right"
              dir="rtl"
            />
            <Button type="submit" className="mt-2">حفظ</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
