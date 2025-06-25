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
  CheckCircle2,
  CreditCard,
  Receipt
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Payment } from '@/types/payment.types';
import { Agreement } from '@/types/agreement';
import { useAgreementPaymentSync } from '@/hooks/payment/use-agreement-payment-sync';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to get payment action button
  const getPaymentActionButton = (payment: Payment) => {
    if (payment.status === 'paid') {
      return null; // لا حاجة لإجراء للمدفوعات المكتملة
    }

    const isOverdue = payment.status === 'overdue';
    const isPending = payment.status === 'pending';

    return (
      <Button
        size="sm"
        onClick={() => {
          setSelectedPayment(payment);
          setIsPaymentDialogOpen(true);
        }}
        className={`
          font-semibold shadow-md transition-all duration-200 hover:scale-105 min-w-[140px]
          ${isOverdue 
            ? 'bg-red-600 hover:bg-red-700 text-white border-red-700' 
            : 'bg-green-600 hover:bg-green-700 text-white border-green-700'
          }
        `}
        variant={isOverdue ? 'destructive' : 'default'}
      >
        <CreditCard className="h-4 w-4 ml-2" />
        {isOverdue ? 'دفع المتأخرات' : 'تسوية الدفعة'}
      </Button>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b text-right" dir="rtl">
          <CardTitle className="flex items-center gap-2 flex-row-reverse">
            <DollarSign className="h-5 w-5 text-blue-600" />
            سجل المدفوعات والإدارة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-right" dir="rtl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل سجل المدفوعات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b text-right" dir="rtl">
        <div className="flex justify-between items-start flex-row-reverse">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl flex-row-reverse">
              <DollarSign className="h-6 w-6 text-blue-600" />
              سجل المدفوعات والإدارة
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 text-right">
              تتبع المدفوعات والمعاملات المالية لهذا العقد
            </p>
          </div>
          <div className="flex gap-2 flex-row-reverse">
            {leaseId && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncAll}
                disabled={isPending?.all}
                className="bg-white"
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 ml-2" />
              تسجيل دفعة
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6" dir="rtl">
        {/* Analytics Overview */}
        {showAnalytics && payments.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">إجمالي المدفوع</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(totalPaid)} ر.ق</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">معلق</p>
                    <p className="text-2xl font-bold text-yellow-900">{formatCurrency(pendingAmount)} ر.ق</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-700">متأخر</p>
                    <p className="text-2xl font-bold text-red-900">{overduePayments.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-700">نسبة الإكمال</p>
                    <p className="text-2xl font-bold text-blue-900">{completionRate.toFixed(1)}%</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment History */}
        {payments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">لا توجد مدفوعات مسجلة بعد</p>
            <p className="text-sm">ابدأ بتسجيل أول دفعة لهذا العقد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <div key={payment.id}>
                <div className="flex items-start justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start space-x-4 flex-1 space-x-reverse">
                    <div className="flex-shrink-0">
                      {getStatusIcon(payment.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <h4 className="text-lg font-bold text-gray-900">
                            {formatCurrency(payment.amount)} ر.ق
                          </h4>
                          <Badge variant={getStatusColor(payment.status)} className="text-xs">
                            {payment.status === 'paid' ? 'مدفوع' : 
                             payment.status === 'pending' ? 'معلق' : 
                             payment.status === 'overdue' ? 'متأخر' : 
                             payment.status === 'completed' ? 'مكتمل' : 
                             payment.status === 'partially_paid' ? 'مدفوع جزئياً' :
                             payment.status === 'cancelled' ? 'ملغي' : 'غير محدد'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {payment.payment_method === 'cash' ? 'نقدي' :
                             payment.payment_method === 'credit_card' ? 'بطاقة ائتمان' :
                             payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                             payment.payment_method || 'غير محدد'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {payment.payment_date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-4 w-4 ml-1" />
                            <span>تاريخ الدفع: {format(new Date(payment.payment_date), 'd MMMM yyyy', { locale: undefined })}</span>
                          </div>
                        )}
                        
                        {payment.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>الوصف:</strong> {payment.description}
                          </div>
                        )}
                        
                        {payment.reference_number && (
                          <div className="text-xs text-gray-500 mt-1">
                            <strong>الرقم المرجعي:</strong> {payment.reference_number}
                          </div>
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
                              <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded border border-red-200 flex-row-reverse">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="text-sm text-red-700">
                                  رسوم التأخير: {formatCurrency(payment.late_fine_amount ?? fee)} ر.ق
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
                                  <Edit className="h-3 w-3 ml-1" />
                                  تعديل
                                </Button>
                              </div>
                            );
                          }
                          
                          if (['completed', 'paid', 'partially_paid'].includes(payment.status) && 
                              payment.late_fine_amount && payment.late_fine_amount > 0) {
                            return (
                              <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded border flex-row-reverse">
                                <span className="text-sm text-gray-700">
                                  رسوم التأخير المدفوعة: {formatCurrency(payment.late_fine_amount)} ر.ق
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
                                  <Edit className="h-3 w-3 ml-1" />
                                  تعديل
                                </Button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 mr-4 space-x-reverse">
                      {/* Main Payment Action Button */}
                      {getPaymentActionButton(payment)}
                      
                      {/* More Options Dropdown */}
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
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل الدفعة
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onPaymentDeleted(payment.id)}
                          >
                            حذف الدفعة
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="lateFee" className="text-right block">رسوم التأخير (ر.ق)</Label>
                <Input
                  id="lateFee"
                  type="number"
                  value={newLateFee}
                  onChange={(e) => setNewLateFee(e.target.value)}
                  min={0}
                  step={1}
                  required
                  className="mt-1 text-right"
                  dir="rtl"
                />
              </div>
              <div className="flex gap-2 pt-4 flex-row-reverse">
                <Button type="submit" className="flex-1">حفظ التغييرات</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditLateFeeDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
