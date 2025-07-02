// @ts-nocheck
/* eslint-disable */
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit, 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  FileText,
  CalendarDays,
  Banknote,
  Receipt
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Payment } from '@/types/payment.types';
import { Agreement } from '@/types/agreement';
import { useAgreementPaymentSync } from '@/hooks/payment/use-agreement-payment-sync';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { toast } from 'sonner';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const {
    syncAll,
    isPending
  } = useAgreementPaymentSync(leaseId);

  // حساب الإحصائيات المالية
  const financialStats = useMemo(() => {
    const totalPaid = payments
      .filter(p => ['paid', 'completed'].includes(p.status || ''))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const totalPending = payments
      .filter(p => ['pending', 'overdue'].includes(p.status || ''))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const totalLateFees = payments
      .reduce((sum, p) => sum + (p.late_fine_amount || 0), 0);
    
    const paidCount = payments.filter(p => ['paid', 'completed'].includes(p.status || '')).length;
    const pendingCount = payments.filter(p => ['pending', 'overdue'].includes(p.status || '')).length;
    const overdueCount = payments.filter(p => p.status === 'overdue').length;
    
    const paymentProgress = payments.length > 0 ? Math.round((paidCount / payments.length) * 100) : 0;
    
    return {
      totalPaid,
      totalPending,
      totalLateFees,
      paidCount,
      pendingCount,
      overdueCount,
      paymentProgress,
      totalAmount: totalPaid + totalPending
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
          lease_id: leaseId,
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
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method: string | undefined) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'card':
      case 'credit_card':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'bank_transfer':
        return <Receipt className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'غير محدد';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: ar });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const getPaymentMethodText = (method: string | undefined) => {
    switch (method) {
      case 'cash':
        return 'نقداً';
      case 'card':
      case 'credit_card':
        return 'بطاقة ائتمان';
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'check':
        return 'شيك';
      default:
        return method || 'غير محدد';
    }
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

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <DollarSign className="h-6 w-6" />
            سجل المدفوعات المفصّل
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <p className="text-lg text-muted-foreground">جاري تحميل سجل المدفوعات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
      {/* Header with gradient */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex justify-between items-start flex-row-reverse" dir="rtl">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl flex-row-reverse">
              <DollarSign className="h-7 w-7" />
              سجل المدفوعات المفصّل
            </CardTitle>
            <p className="text-blue-100 mt-2 text-right">
              إدارة شاملة للمدفوعات والتحصيلات المالية
            </p>
          </div>
          <div className="flex gap-3 flex-row-reverse">
            {leaseId && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncAll}
                disabled={isPending?.all}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${isPending?.all ? 'animate-spin' : ''}`} />
                مزامنة
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setSelectedPayment(null);
                setIsPaymentDialogOpen(true);
              }}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
            >
              <Plus className="h-4 w-4 ml-2" />
              تسجيل دفعة جديدة
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Financial Summary */}
      {showAnalytics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" dir="rtl">
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <p className="text-sm text-gray-600">إجمالي المدفوع</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(financialStats.totalPaid)}</p>
                  <p className="text-xs text-gray-500">ريال قطري</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <p className="text-sm text-gray-600">المبلغ المعلق</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(financialStats.totalPending)}</p>
                  <p className="text-xs text-gray-500">ريال قطري</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <p className="text-sm text-gray-600">رسوم التأخير</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(financialStats.totalLateFees)}</p>
                  <p className="text-xs text-gray-500">ريال قطري</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <p className="text-sm text-gray-600">نسبة التحصيل</p>
                  <p className="text-2xl font-bold text-blue-600">{financialStats.paymentProgress}%</p>
                  <Progress value={financialStats.paymentProgress} className="mt-2 h-2" />
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex justify-center gap-6 mt-6 flex-row-reverse" dir="rtl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {financialStats.paidCount} مدفوعة
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {financialStats.pendingCount} معلقة
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                {financialStats.overdueCount} متأخرة
              </Badge>
            </div>
          </div>
        </div>
      )}
      
      <CardContent className="p-6">
        {payments.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-blue-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
              <FileText className="h-12 w-12 text-blue-600 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مدفوعات مسجلة</h3>
            <p className="text-gray-600 mb-6">ابدأ بتسجيل أول دفعة لهذا العقد</p>
            <Button
              onClick={() => {
                setSelectedPayment(null);
                setIsPaymentDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 ml-2" />
              تسجيل أول دفعة
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {[...payments]
              .sort((a, b) => {
                // ترتيب من الأحدث إلى الأقدم
                const dateA = new Date(a.payment_date || a.created_at || 0);
                const dateB = new Date(b.payment_date || b.created_at || 0);
                return dateB.getTime() - dateA.getTime();
              })
              .map((payment, index) => (
              <div
                key={payment.id}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300"
                dir="rtl"
              >
                {/* Payment Status Indicator */}
                <div className={`absolute right-0 top-0 h-full w-1 ${
                  payment.status === 'paid' ? 'bg-green-500' :
                  payment.status === 'pending' ? 'bg-yellow-500' :
                  payment.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
                }`} />

                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4 flex-row-reverse">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        {getStatusIcon(payment.status || '')}
                        <span className="text-lg font-bold text-gray-900">
                          دفعة #{index + 1}
                        </span>
                      </div>
                      <Badge 
                        variant={getStatusColor(payment.status || '')}
                        className="text-sm"
                      >
                        {getStatusText(payment.status || '')}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {formatCurrency(payment.amount)} ر.ق
                      </div>
                      {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                        <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded-md">
                          + {formatCurrency(payment.late_fine_amount)} ر.ق (رسوم تأخير)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                        <CalendarDays className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">تاريخ الاستحقاق</span>
                      </div>
                      <p className="text-right text-gray-900 font-medium">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <span className="text-sm font-medium text-gray-700">طريقة الدفع</span>
                      </div>
                      <p className="text-right text-gray-900 font-medium">
                        {getPaymentMethodText(payment.payment_method)}
                      </p>
                    </div>

                    {payment.reference_number && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                          <Receipt className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">رقم المرجع</span>
                        </div>
                        <p className="text-right text-gray-900 font-medium font-mono text-sm">
                          {payment.reference_number}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {payment.description && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">ملاحظات</span>
                      </div>
                      <p className="text-right text-blue-900">{payment.description}</p>
                    </div>
                  )}

                  {/* Late Fee Section */}
                  {(() => {
                    // Show dynamic late fee for pending/overdue
                    if ((payment.status === 'pending' || payment.status === 'overdue') && payment.payment_date) {
                      const today = new Date();
                      const dueDate = new Date(payment.payment_date);
                      const firstOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
                      const daysLate = Math.max(0, differenceInCalendarDays(today, firstOfMonth));
                      const fee = Math.min(daysLate * 120, 3000);
                      return (
                        <div className="bg-red-50 rounded-lg p-3 mb-4 border border-red-200">
                          <div className="flex items-center justify-between flex-row-reverse">
                            <div className="text-right">
                              <p className="text-sm font-medium text-red-700">رسوم التأخير المحتملة</p>
                              <p className="text-lg font-bold text-red-600">
                                {formatCurrency(payment.late_fine_amount ?? fee)} ر.ق
                              </p>
                              {daysLate > 0 && (
                                <p className="text-xs text-red-600">
                                  متأخر {daysLate} يوم
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setNewLateFee(String(payment.late_fine_amount ?? fee));
                                setIsEditLateFeeDialogOpen(true);
                              }}
                              className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                              <Edit className="h-3 w-3 ml-1" />
                              تعديل
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <Separator className="my-4" />

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    {payment.status !== 'paid' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-200 px-6"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsPaymentDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        تسوية الدفعة
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
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
                      className="border-red-300 text-red-700 hover:bg-red-50"
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
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
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
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 flex-row-reverse">
              <Edit className="h-5 w-5 text-blue-600" />
              تعديل رسوم التأخير
            </DialogTitle>
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
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  حفظ التعديل
                </Button>
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
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
              <div className="text-right space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">المبلغ:</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(paymentToDelete.amount)} ر.ق
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">الحالة:</span>
                  <Badge variant={getStatusColor(paymentToDelete.status || 'pending')} className="text-sm">
                    {getStatusText(paymentToDelete.status || 'pending')}
                  </Badge>
                </div>
                {paymentToDelete.payment_date && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">التاريخ:</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(paymentToDelete.payment_date)}
                    </span>
                  </div>
                )}
                {paymentToDelete.description && (
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-700">الوصف:</span>
                    <span className="text-sm text-gray-600 text-right max-w-48">
                      {paymentToDelete.description}
                    </span>
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
    </Card>
  );
}
