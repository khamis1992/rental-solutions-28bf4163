import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

// دالة مساعدة لتنسيق التاريخ بأمان
const formatDateSafely = (date: Date): string => {
  try {
    return date.toLocaleDateString('ar-QA') || date.toLocaleDateString() || 'تاريخ غير صحيح';
  } catch {
    return 'تاريخ غير صحيح';
  }
};

// دالة محلية لتحليل وصف الدفعة 
const parsePaymentDescription = (description: string): { month: number, year: number } | null => {
  if (!description) return null;
  
  const monthMatch = description.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
  const yearMatch = description.match(/\b(20\d{2})\b/);
  
  if (monthMatch && yearMatch) {
    const monthsMap: { [key: string]: number } = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    
    const month = monthsMap[monthMatch[0].toLowerCase()];
    const year = parseInt(yearMatch[0]);
    
    return { month, year };
  }
  
  return null;
};

// دالة حساب غرامة التأخير
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

// دالة لتحويل الوصف الإنجليزي إلى عربي مبسط
const formatPaymentDescription = (description: string): string => {
  if (!description) return 'دفعة إيجار';
  
  // استخراج الشهر والسنة من الوصف الإنجليزي
  const monthMatch = description.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
  const yearMatch = description.match(/\b(20\d{2})\b/);
  
  if (monthMatch && yearMatch) {
    const monthsMap: { [key: string]: string } = {
      'january': 'يناير', 'february': 'فبراير', 'march': 'مارس',
      'april': 'أبريل', 'may': 'مايو', 'june': 'يونيو',
      'july': 'يوليو', 'august': 'أغسطس', 'september': 'سبتمبر',
      'october': 'أكتوبر', 'november': 'نوفمبر', 'december': 'ديسمبر'
    };
    
    const arabicMonth = monthsMap[monthMatch[0].toLowerCase()];
    const year = yearMatch[0];
    
    return `إيجار شهر ${arabicMonth} ${year}`;
  }
  
  return 'دفعة إيجار';
};

// دالة لتحديد حالة الدفعة الذكية
const getSmartPaymentStatus = (payment: any): { 
  status: 'paid' | 'pending' | 'overdue', 
  reason: string,
  daysDifference: number,
  computedDueDate?: Date 
} => {
  const today = new Date();
  
  // إذا كانت مدفوعة، لا نحتاج تحليل إضافي
  if (payment.status === 'paid' || payment.status === 'completed') {
    return { 
      status: 'paid', 
      reason: 'الدفعة مسجلة كمدفوعة في النظام', 
      daysDifference: 0 
    };
  }
  
  // تحليل النص لاستخراج التاريخ المقصود
  const parsedDate = parsePaymentDescription(payment.description || '');
  let computedDueDate: Date | null = null;
  
  if (parsedDate) {
    // إنشاء تاريخ استحقاق محسوب من النص (آخر يوم في الشهر)
    computedDueDate = new Date(parsedDate.year, parsedDate.month - 1, 1);
    const lastDayOfMonth = new Date(parsedDate.year, parsedDate.month, 0).getDate();
    computedDueDate.setDate(lastDayOfMonth);
    
    console.log(`🤖 تاريخ الاستحقاق المحسوب من النص: ${formatDateSafely(computedDueDate)}`);
  }
  
  // استخدام تاريخ الاستحقاق المسجل في قاعدة البيانات كأولوية
  const dbDueDate = payment.due_date ? new Date(payment.due_date) : null;
  
  // اختيار التاريخ الأكثر دقة
  const effectiveDueDate = dbDueDate || computedDueDate;
  
  if (!effectiveDueDate) {
    return { 
      status: 'pending', 
      reason: 'لا يمكن تحديد تاريخ الاستحقاق', 
      daysDifference: 0 
    };
  }
  
  const daysDifference = Math.floor((today.getTime() - effectiveDueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  console.log(`📊 مقارنة التواريخ:`, {
    today: formatDateSafely(today),
    dbDueDate: dbDueDate ? formatDateSafely(dbDueDate) : 'غير محدد',
    computedDueDate: computedDueDate ? formatDateSafely(computedDueDate) : 'غير محدد',
    effectiveDueDate: formatDateSafely(effectiveDueDate),
    daysDifference: `${daysDifference} يوم`,
    isOverdue: daysDifference > 0
  });
  
  if (daysDifference > 0) {
    // متأخرة
    let reason = `تاريخ الاستحقاق (${formatDateSafely(effectiveDueDate)}) مضى منذ ${daysDifference} يوم`;
    if (computedDueDate && !dbDueDate) {
      reason += ` (محسوب من النص: "${payment.description}")`;
    }
    return { 
      status: 'overdue', 
      reason, 
      daysDifference,
      computedDueDate: effectiveDueDate
    };
  } else {
    // معلقة
    let reason = `تاريخ الاستحقاق (${formatDateSafely(effectiveDueDate)}) لم يأتِ بعد (باقي ${Math.abs(daysDifference)} يوم)`;
    if (computedDueDate && !dbDueDate) {
      reason += ` (محسوب من النص: "${payment.description}")`;
    }
    return { 
      status: 'pending', 
      reason, 
      daysDifference,
      computedDueDate: effectiveDueDate
    };
  }
};

// دالة لحساب تفاصيل غرامة التأخير
const getLateFeeDetails = (payment: Payment) => {
  const lateFee = calculateLateFee(payment);
  if (lateFee === 0) return null;
  
  if ((payment.status === 'pending' || payment.status === 'overdue') && payment.payment_date) {
    const today = new Date();
    const dueDate = new Date(payment.payment_date);
    const firstOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
    const daysLate = Math.max(0, differenceInCalendarDays(today, firstOfMonth));
    
    return {
      amount: lateFee,
      daysLate,
      dailyRate: 120,
      isActive: payment.status === 'overdue'
    };
  }
  
  return {
    amount: lateFee,
    daysLate: 0,
    dailyRate: 0,
    isActive: false
  };
};

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

  // Calculate payment statistics with smart analysis
  const paymentStats = React.useMemo(() => {
    let smartPaid = 0;
    let smartPending = 0;
    let smartOverdue = 0;
    let totalLateFees = 0;
    
    // تحليل كل دفعة باستخدام النظام الذكي
    const analyzedPayments = payments.map(payment => {
      const smartStatus = getSmartPaymentStatus(payment);
      
      // عد الدفعات حسب الحالة الذكية
      if (smartStatus.status === 'paid') {
        smartPaid++;
      } else if (smartStatus.status === 'pending') {
        smartPending++;
      } else if (smartStatus.status === 'overdue') {
        smartOverdue++;
      }
      
      return {
        ...payment,
        smartStatus
      };
    });

    // حساب غرامات التأخير (3000 ر.ق لكل شهر متأخر)
    totalLateFees = smartOverdue * 3000;
    
    // إضافة نتائج التحليل للـ console
    // حساب عدد الدفعات التي تحتاج تحديث
    const needsUpdate = analyzedPayments.filter(p => 
      p.status !== p.smartStatus.status && p.smartStatus.status !== 'paid'
    ).length;

    console.log(`📊 تحليل دفعات العقد:`, {
      total: payments.length,
      originalCounts: {
        paid: payments.filter(p => p.status === 'paid' || p.status === 'completed').length,
        pending: payments.filter(p => p.status === 'pending').length,
        overdue: payments.filter(p => p.status === 'overdue').length
      },
      smartCounts: {
        paid: smartPaid,
        pending: smartPending,
        overdue: smartOverdue
      },
      needsUpdate: `${needsUpdate} دفعات تحتاج تحديث`,
      totalLateFees: `${totalLateFees.toLocaleString()} ر.ق`
    });
    
    return {
      total: payments.length,
      paid: smartPaid,
      pending: smartPending,
      overdue: smartOverdue,
      totalLateFees,
      analyzedPayments,
      needsUpdate
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

  const getStatusIcon = (status: string | null | undefined) => {
    const safeStatus = status || 'pending';
    switch (safeStatus) {
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

  const getStatusText = (status: string | null | undefined) => {
    const safeStatus = status || 'pending';
    switch (safeStatus) {
      case 'completed':
      case 'paid':
        return 'مدفوعة';
      case 'pending':
        return 'معلقة';
      case 'overdue':
        return 'متأخرة';
      default:
        return safeStatus;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    const safeStatus = status || 'pending';
    switch (safeStatus) {
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

  const formatCurrency = (amount: number | null | undefined) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(safeAmount);
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
            <div className="space-y-3">
              {[...payments]
                .sort((a, b) => {
                  // ترتيب من الأقدم إلى الأحدث
                  const dateA = new Date(a.payment_date || a.created_at || 0);
                  const dateB = new Date(b.payment_date || b.created_at || 0);
                  return dateA.getTime() - dateB.getTime();
                })
                .map((payment) => {
                const lateFee = calculateLateFee(payment);
                const lateFeeDetails = getLateFeeDetails(payment);
                return (
                  <div
                    key={payment.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-sm ${
                      payment.status === 'paid' || payment.status === 'completed'
                        ? 'bg-green-50/50 border-green-200'
                        : payment.status === 'pending'
                        ? 'bg-yellow-50/50 border-yellow-200'
                        : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4" dir="rtl">
                      {/* Payment Info - Right Side */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          {getStatusIcon(payment.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-semibold text-gray-900">
                              {formatCurrency(payment.amount)} ر.ق
                            </span>
                            <Badge className={`${getStatusColor(payment.status)} text-xs px-2 py-0.5`}>
                              {getStatusText(payment.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                              الاستحقاق: 1 من كل شهر
                            </span>
                            {payment.description && (
                              <span className="truncate max-w-xs">
                                {formatPaymentDescription(payment.description)}
                              </span>
                            )}
                          </div>
                          
                          {/* تفاصيل غرامة التأخير المحسنة */}
                          {lateFeeDetails && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-semibold text-red-800">غرامة التأخير: </span>
                                  <span className="text-red-600 font-bold">{formatCurrency(lateFeeDetails.amount)} ر.ق</span>
                                  {lateFeeDetails.daysLate > 0 && (
                                    <span className="text-red-600 mr-2">
                                      ({lateFeeDetails.daysLate} يوم × {lateFeeDetails.dailyRate} ر.ق)
                                    </span>
                                  )}
                                  {lateFeeDetails.isActive && (
                                    <span className="text-red-500 mr-2">⚠️ تزيد يومياً</span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs px-2 py-1 h-6 border-red-300 text-red-700 hover:bg-red-100"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setNewLateFee(String(lateFeeDetails.amount));
                                    setIsEditLateFeeDialogOpen(true);
                                  }}
                                >
                                  تعديل
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions - Left Side */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {payment.status !== 'paid' && payment.status !== 'completed' ? (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsPaymentDialogOpen(true);
                            }}
                          >
                            تسوية
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-300 text-xs px-2 py-1">
                            ✓ مُسوّاة
                          </Badge>
                        )}
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-100"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsPaymentDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-100"
                            onClick={() => {
                              setPaymentToDelete(payment);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                      </div>
                    </div>
                  </div>
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
                    <span className="text-sm">{formatPaymentDescription(paymentToDelete.description)}</span>
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