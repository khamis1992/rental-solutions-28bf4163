import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { usePaymentDetails } from '@/hooks/use-payment-details';
import { usePayments } from '@/hooks/use-payments';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { errorLogger } from '@/lib/errors/error-logger';

interface PaymentForAgreementProps {
  onBack: () => void;
  onClose: () => void;
}

export function PaymentForAgreement({ onBack, onClose }: PaymentForAgreementProps) {
  const [carNumber, setCarNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const { data, isLoading, error } = usePaymentDetails(carNumber);
  const { addPayment } = usePayments(data?.leaseId || '');

  // Group payments by their status
  const getGroupedPayments = () => {
    if (!data?.allPayments) return { pending: [], completed: [], overdue: [], other: [] };
    
    return data.allPayments.reduce((groups, payment) => {
      const status = payment.status.toLowerCase();
      if (status === 'pending' || status === 'partially_paid') {
        groups.pending.push(payment);
      } else if (status === 'completed') {
        groups.completed.push(payment);
      } else if (status === 'overdue') {
        groups.overdue.push(payment);
      } else {
        groups.other.push(payment);
      }
      return groups;
    }, { 
      pending: [], 
      completed: [], 
      overdue: [], 
      other: [] 
    } as Record<string, any[]>);
  };

  const groupedPayments = getGroupedPayments();

  // Get status badge based on payment status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-500">مدفوع</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">معلق</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-500">مدفوع جزئياً</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">متأخر</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">ملغي</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-500">مسترد</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only proceed if we have valid data
      if (!data?.leaseId) {
        throw new Error('لم يتم العثور على اتفاقية صالحة');
      }

      // If a specific payment is selected, use that payment
      let paymentData;
      
      if (selectedPaymentId && selectedPaymentId !== 'new') {
        // Find the selected payment
        const selectedPayment = data.allPayments.find(p => p.id === selectedPaymentId);
        
        if (!selectedPayment) {
          throw new Error('الدفعة المحددة غير موجودة');
        }

        // Update the existing payment to mark it as completed
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update({
            status: 'paid',
            payment_date: new Date().toISOString(),
            payment_method: 'cash',
            description: `دفعة لـ ${data.agreementNumber}`
          })
          .eq('id', selectedPaymentId);

        if (updateError) throw updateError;
        
        toast({
          title: "تم تسجيل الدفعة",
          description: `تم تسجيل الدفعة المحددة بمبلغ ${selectedPayment.amount} ريال قطري كمكتملة.`,
        });
      } else {
        // Create a new payment if no specific payment was selected or "new" was selected
        paymentData = {
          amount: data.rentAmount,
          payment_date: new Date().toISOString(),
          lease_id: data.leaseId,
          payment_method: 'cash',
          description: `دفعة إيجار شهرية لـ ${data.agreementNumber}`,
          status: 'paid' as const,
          type: 'Income',
          late_fine_amount: data.lateFeeAmount || 0
        };

        await addPayment(paymentData);
        
        toast({
          title: "تم تسجيل الدفعة",
          description: "تم تسجيل الدفعة بنجاح.",
        });
      }
      
      onClose();
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'PaymentForAgreement.handleSubmit',
        carNumber,
        selectedPaymentId,
        leaseId: data?.leaseId
      });
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الدفعة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <Button
        type="button"
        variant="ghost"
        className="mb-2 flex-row-reverse"
        onClick={onBack}
      >
        <ChevronLeft className="h-4 w-4 ml-2" />
        العودة
      </Button>

      <div className="space-y-2">
        <Label htmlFor="carNumber" className="text-right">رقم السيارة</Label>
        <Input
          id="carNumber"
          placeholder="أدخل رقم السيارة"
          value={carNumber}
          onChange={(e) => {
            setCarNumber(e.target.value);
            setSelectedPaymentId(null); // Reset selection when car number changes
          }}
          required
          className="text-right"
          dir="rtl"
        />
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground text-right">جاري تحميل تفاصيل الدفع...</div>
      )}

      {error && (
        <div className="text-sm text-destructive text-right">{error}</div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            {data.agreementNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-right">رقم الاتفاقية:</span>
                <span className="font-semibold text-right">{data.agreementNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-right">مبلغ الإيجار الحالي:</span>
              <span className="font-semibold text-right">{data.rentAmount.toFixed(2)} ر.ق</span>
            </div>
            <div className="flex justify-between">
              <span className="text-right">رسوم التأخير:</span>
              <span className="font-semibold text-destructive text-right">
                {data.lateFeeAmount.toFixed(2)} ر.ق
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-right">إجمالي المبلغ المستحق:</span>
              <span className="font-semibold text-right">{data.totalDue.toFixed(2)} ر.ق</span>
            </div>
            {data.contractAmount !== null && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="text-right">إجمالي مبلغ العقد:</span>
                <span className="text-right">{data.contractAmount.toFixed(2)} ر.ق</span>
              </div>
            )}
          </div>

          {data.allPayments && data.allPayments.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-right">اختر دفعة للتسجيل</Label>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="pending" className="text-xs">
                    معلقة ({groupedPayments.pending.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs">
                    مكتملة ({groupedPayments.completed.length})
                  </TabsTrigger>
                  <TabsTrigger value="overdue" className="text-xs">
                    متأخرة ({groupedPayments.overdue.length})
                  </TabsTrigger>
                  <TabsTrigger value="new" className="text-xs">
                    دفعة جديدة
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="pt-2">
                  {groupedPayments.pending.length > 0 ? (
                    <RadioGroup 
                      value={selectedPaymentId || ''} 
                      onValueChange={setSelectedPaymentId}
                      className="space-y-2"
                    >
                      {groupedPayments.pending.map((payment) => (
                        <div key={payment.id} className="flex items-center space-x-reverse space-x-2 border rounded-md p-3" dir="rtl">
                          <RadioGroupItem value={payment.id} id={payment.id} />
                          <div className="grid flex-1">
                            <div className="flex justify-between">
                              <Label htmlFor={payment.id} className="font-medium text-right">
                                {payment.amount.toFixed(2)} ر.ق
                              </Label>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground text-right">
                                {payment.description || 'دفعة'}
                              </span>
                              <span className="text-sm text-muted-foreground text-right">
                                الاستحقاق: {payment.due_date ? formatDate(payment.due_date) : 'غير محدد'}
                              </span>
                            </div>
                            {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                              <div className="text-sm text-red-500 mt-1 text-right">
                                رسوم التأخير: {payment.late_fine_amount.toFixed(2)} ر.ق
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      لا توجد دفعات معلقة
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="pt-2">
                  {groupedPayments.completed.length > 0 ? (
                    <RadioGroup 
                      value={selectedPaymentId || ''} 
                      onValueChange={setSelectedPaymentId}
                      className="space-y-2"
                    >
                      {groupedPayments.completed.map((payment) => (
                        <div key={payment.id} className="flex items-center space-x-reverse space-x-2 border rounded-md p-3" dir="rtl">
                          <RadioGroupItem value={payment.id} id={payment.id} />
                          <div className="grid flex-1">
                            <div className="flex justify-between">
                              <Label htmlFor={payment.id} className="font-medium text-right">
                                {payment.amount.toFixed(2)} ر.ق
                              </Label>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground text-right">
                                {payment.description || 'دفعة'}
                              </span>
                              <span className="text-sm text-muted-foreground text-right">
                                تم الدفع: {payment.payment_date ? formatDate(payment.payment_date) : 'غير محدد'}
                              </span>
                            </div>
                            {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                              <div className="text-sm text-red-500 mt-1 text-right">
                                رسوم التأخير: {payment.late_fine_amount.toFixed(2)} ر.ق
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      لا توجد دفعات مكتملة
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="overdue" className="pt-2">
                  {groupedPayments.overdue.length > 0 ? (
                    <RadioGroup 
                      value={selectedPaymentId || ''} 
                      onValueChange={setSelectedPaymentId}
                      className="space-y-2"
                    >
                      {groupedPayments.overdue.map((payment) => (
                        <div key={payment.id} className="flex items-center space-x-reverse space-x-2 border rounded-md p-3" dir="rtl">
                          <RadioGroupItem value={payment.id} id={payment.id} />
                          <div className="grid flex-1">
                            <div className="flex justify-between">
                              <Label htmlFor={payment.id} className="font-medium text-right">
                                {payment.amount.toFixed(2)} ر.ق
                              </Label>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground text-right">
                                {payment.description || 'دفعة'}
                              </span>
                              <span className="text-sm text-red-500 font-medium text-right">
                                متأخر منذ: {payment.due_date ? formatDate(payment.due_date) : 'غير محدد'}
                              </span>
                            </div>
                            {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                              <div className="text-sm text-red-500 mt-1 text-right">
                                رسوم التأخير: {payment.late_fine_amount.toFixed(2)} ر.ق
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      لا توجد دفعات متأخرة
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="new" className="pt-2">
                  <RadioGroup value={selectedPaymentId === 'new' ? 'new' : ''} onValueChange={() => setSelectedPaymentId('new')}>
                    <div className="flex items-center space-x-reverse space-x-2 border rounded-md p-3" dir="rtl">
                      <RadioGroupItem value="new" id="new-payment" />
                      <div className="grid flex-1">
                        <Label htmlFor="new-payment" className="font-medium text-right">إنشاء دفعة جديدة</Label>
                        <span className="text-sm text-muted-foreground text-right">
                          المبلغ: {data.totalDue.toFixed(2)} ر.ق (الإيجار + رسوم التأخير)
                        </span>
                        {data.lateFeeAmount > 0 && (
                          <span className="text-sm text-red-500 text-right">
                            يشمل رسوم التأخير: {data.lateFeeAmount.toFixed(2)} ر.ق
                          </span>
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center p-4 border rounded-md">
              <p className="text-muted-foreground text-right">لا توجد دفعات لهذه الاتفاقية.</p>
              <p className="text-sm text-muted-foreground mt-2 text-right">
                يمكنك إنشاء دفعة جديدة أدناه.
              </p>
              <div className="mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedPaymentId('new')}
                >
                  إنشاء دفعة جديدة
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 flex-row-reverse">
        <Button type="button" variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button 
          type="submit" 
          disabled={!carNumber || loading || isLoading || !!error || !data || (!selectedPaymentId && selectedPaymentId !== 'new')}
        >
          تسجيل الدفعة
        </Button>
      </div>
    </form>
  );
}
