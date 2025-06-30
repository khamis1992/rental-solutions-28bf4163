import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, RefreshCw, Clock, CheckCircle, AlertTriangle, CreditCard, DollarSign, Trash2, Edit } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Payment } from '@/types/payment.types';
import { Agreement } from '@/types/agreement';
import { useAgreementPaymentSync } from '@/hooks/payment/use-agreement-payment-sync';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface EnhancedPaymentHistorySectionProps {
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

export function EnhancedPaymentHistorySection({
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
}: EnhancedPaymentHistorySectionProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditLateFeeDialogOpen, setIsEditLateFeeDialogOpen] = useState(false);
  const [newLateFee, setNewLateFee] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const {
    syncAll,
    isPending
  } = useAgreementPaymentSync(leaseId);

  // Calculate payment statistics
  const paymentStats = React.useMemo(() => {
    const paidPayments = payments.filter(p => p.status === 'paid' || p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    
    const totalLateFees = payments.reduce((sum, p) => sum + (p.late_fine_amount || 0), 0);
    
    return {
      total: payments.length,
      paid: paidPayments.length,
      pending: pendingPayments.length,
      overdue: overduePayments.length,
      totalLateFees
    };
  }, [payments]);

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

  // Updated handleRecordPayment to handle payment settlement
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
    if (paymentId && selectedPayment) {
      // Settlement: Update existing payment to mark as paid
      try {
        const updatedPayment: Partial<Payment> = {
          id: paymentId,
          status: 'paid',
          payment_date: date.toISOString(),
          payment_method: method || 'cash',
          reference_number: reference || '',
          description: notes || selectedPayment.description || '',
          amount_paid: amount,
          balance: Math.max(0, selectedPayment.amount - amount)
        };
        
        const success = await onPaymentUpdated(updatedPayment);
        if (success && typeof fetchPayments === 'function') {
          fetchPayments();
        }
        return success;
      } catch (err) {
        console.error('Settlement failed:', err);
        return false;
      }
    } else {
      // Create new payment
      try {
        const newPayment: Partial<Payment> = {
          amount,
          payment_date: date.toISOString(),
          description: notes || '',
          payment_method: method || 'cash',
          reference_number: reference || '',
          lease_id: leaseId || '',
          status: 'paid'
        };
        await onRecordPayment(newPayment);
        if (typeof fetchPayments === 'function') {
          fetchPayments();
        }
        return true;
      } catch (err) {
        console.error('Payment creation failed:', err);
        return false;
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'مدفوعة';
      case 'pending':
        return 'معلقة';
      case 'overdue':
        return 'متأخرة';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle payment deletion
  const handleDeletePayment = async () => {
    if (!paymentToDelete?.id) return;
    
    try {
      await onPaymentDeleted(paymentToDelete.id);
      toast.success('تم حذف الدفعة بنجاح');
      setIsDeleteDialogOpen(false);
      setPaymentToDelete(null);
      if (typeof fetchPayments === 'function') {
        fetchPayments();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('فشل في حذف الدفعة');
    }
  };

  const calculateLateFee = (payment: Payment) => {
    if (payment.status === 'paid' || payment.status === 'completed') {
      return payment.late_fine_amount || 0;
    }
    
    if ((payment.status === 'pending' || payment.status === 'overdue') && payment.payment_date) {
      const today = new Date();
      const dueDate = new Date(payment.payment_date);
      const firstOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
      const daysLate = Math.max(0, differenceInCalendarDays(today, firstOfMonth));
      const fee = Math.min(daysLate * 120, 3000);
      return fee;
    }
    
    return 0;
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
    <div className="space-y-6" dir="rtl">
      {/* Payment Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إجمالي الدفعات</p>
                <p className="text-2xl font-bold text-blue-600">{paymentStats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">مدفوعة</p>
                <p className="text-2xl font-bold text-green-600">{paymentStats.paid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">معلقة</p>
                <p className="text-2xl font-bold text-yellow-600">{paymentStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">متأخرة</p>
                <p className="text-2xl font-bold text-red-600">{paymentStats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center" dir="rtl">
            <div className="text-left">
              <CardTitle className="text-left">سجل المدفوعات المفصّل</CardTitle>
              <div className="text-muted-foreground text-sm mt-1 text-left" dir="rtl">
                تفاصيل كاملة لجميع المدفوعات مع الحالات ورسوم التأخير
              </div>
            </div>
            <div className="flex gap-2">
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
        </CardHeader>
        
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مدفوعات مسجلة بعد
            </div>
          ) : (
            <div className="space-y-4">
              {[...payments]
                .sort((a, b) => {
                  // ترتيب من الأقدم إلى الأحدث
                  const dateA = new Date(a.payment_date || a.created_at || 0);
                  const dateB = new Date(b.payment_date || b.created_at || 0);
                  return dateA.getTime() - dateB.getTime();
                })
                .map((payment) => {
                const lateFee = calculateLateFee(payment);
                return (
                  <Card
                    key={payment.id}
                    className={`border-l-4 ${
                      payment.status === 'paid' || payment.status === 'completed'
                        ? 'border-l-green-500 bg-green-50/30'
                        : payment.status === 'pending'
                        ? 'border-l-yellow-500 bg-yellow-50/30'
                        : 'border-l-red-500 bg-red-50/30'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6" dir="rtl">
                        <div className="flex items-start space-x-4 space-x-reverse flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(payment.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Payment Amount */}
                            <div className="flex items-center gap-3 flex-row-reverse mb-3">
                              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {formatCurrency(payment.amount)} ر.ق
                              </h3>
                              <Badge className={`${getStatusColor(payment.status)} font-medium px-3 py-1`}>
                                {getStatusText(payment.status)}
                              </Badge>
                            </div>
                            
                            {/* Due Date */}
                            <div className="text-sm text-blue-600 font-medium mb-3 bg-blue-50 px-3 py-1 rounded-md inline-block">
                              الاستحقاق: 1 من كل شهر
                            </div>
                            
                            {/* Late Fee Information */}
                            {lateFee > 0 && (
                              <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-between flex-row-reverse">
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-red-800">رسوم التأخير</p>
                                    <p className="text-lg font-bold text-red-600">
                                      {formatCurrency(lateFee)} ر.ق
                                    </p>
                                    {payment.status === 'overdue' && (
                                      <p className="text-xs text-red-600 mt-1">
                                        يزيد بـ 120 ر.ق يومياً
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setNewLateFee(String(lateFee));
                                      setIsEditLateFeeDialogOpen(true);
                                    }}
                                  >
                                    تعديل الرسوم
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {/* Description */}
                            {payment.description && (
                              <div className="text-sm text-muted-foreground">
                                {payment.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 min-w-[140px]">
                          {payment.status !== 'paid' && payment.status !== 'completed' && (
                            <Button
                              size="default"
                              className="bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-200 hover:scale-105 font-semibold"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setIsPaymentDialogOpen(true);
                              }}
                            >
                              تسوية الدفعة
                            </Button>
                          )}
                          {(payment.status === 'paid' || payment.status === 'completed') && (
                            <Badge variant="outline" className="text-green-600 border-green-300 px-4 py-2 text-sm font-medium bg-green-50">
                              ✓ مُسوّاة
                            </Badge>
                          )}
                          
                          {/* Edit and Delete buttons for all payments */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setIsPaymentDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 ml-1" />
                              تعديل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setPaymentToDelete(payment);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
        rentAmount={rentAmount || 0}
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
                try {
                  const success = await onPaymentUpdated({
                    id: selectedPayment.id,
                    late_fine_amount: Number(newLateFee),
                  });
                  
                  if (success) {
                    toast.success('تم تحديث رسوم التأخير بنجاح');
                    setIsEditLateFeeDialogOpen(false);
                    setSelectedPayment(null);
                    if (typeof fetchPayments === 'function') {
                      fetchPayments();
                    }
                  } else {
                    toast.error('فشل في تحديث رسوم التأخير');
                  }
                } catch (error) {
                  console.error('Error updating late fee:', error);
                  toast.error('حدث خطأ أثناء تحديث رسوم التأخير');
                }
              }
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
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
                  placeholder="أدخل مبلغ رسوم التأخير"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsEditLateFeeDialogOpen(false);
                    setSelectedPayment(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit">حفظ التعديل</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader className="text-right">
            <DialogTitle className="text-red-700 flex items-center gap-2 flex-row-reverse">
              <Trash2 className="h-5 w-5" />
              تأكيد حذف الدفعة
            </DialogTitle>
            <DialogDescription className="text-right">
              هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          
          {paymentToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-right space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">المبلغ:</span>
                  <span>{formatCurrency(paymentToDelete.amount)} ر.ق</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">الحالة:</span>
                  <Badge className={getStatusColor(paymentToDelete.status)}>
                    {getStatusText(paymentToDelete.status)}
                  </Badge>
                </div>
                {paymentToDelete.description && (
                  <div className="flex justify-between">
                    <span className="font-semibold">الوصف:</span>
                    <span className="text-sm">{paymentToDelete.description}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setPaymentToDelete(null);
              }}
            >
              إلغاء
            </Button>
            <Button 
              type="button"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeletePayment}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              تأكيد الحذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 