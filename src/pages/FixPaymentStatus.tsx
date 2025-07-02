
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function FixPaymentStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const fixPaymentStatusForAgreement = async (agreementNumber: string) => {
    console.log(`🔄 إصلاح حالة المدفوعات للعقد ${agreementNumber}...`);
    
    try {
      // 1. جلب معرف العقد
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('id, agreement_number')
        .eq('agreement_number', agreementNumber)
        .single();

      if (agreementError || !agreement) {
        console.error('❌ لم يتم العثور على العقد:', agreementError);
        return { success: false, error: 'Agreement not found' };
      }

      console.log(`✅ تم العثور على العقد - ID: ${agreement.id}`);

      // 2. جلب جميع المدفوعات للعقد
      const { data: payments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('id, amount, original_due_date, status, description')
        .eq('lease_id', agreement.id)
        .order('original_due_date');

      if (paymentsError) {
        console.error('❌ خطأ في جلب المدفوعات:', paymentsError);
        return { success: false, error: paymentsError.message };
      }

      console.log(`📋 تم العثور على ${payments?.length || 0} مدفوعات`);

      if (!payments || payments.length === 0) {
        return { success: true, message: 'لا توجد مدفوعات للعقد' };
      }

      // 3. تحديد المدفوعات المتأخرة
      const today = new Date();
      const overduePayments = payments.filter(payment => {
        const dueDate = new Date(payment.original_due_date);
        return payment.status === 'pending' && dueDate < today;
      });

      console.log(`⏰ المدفوعات المتأخرة: ${overduePayments.length}`);

      if (overduePayments.length === 0) {
        return { success: true, message: 'جميع المدفوعات محدثة' };
      }

      // 4. تحديث حالة المدفوعات المتأخرة
      const updatePromises = overduePayments.map(async (payment) => {
        const dueDate = new Date(payment.original_due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const lateFeeAmount = Math.min(daysOverdue * 120, 3000); // 120 ر.ق/يوم، حد أقصى 3000

        return supabase
          .from('unified_payments')
          .update({
            status: 'overdue',
            days_overdue: daysOverdue,
            late_fine_amount: lateFeeAmount
          })
          .eq('id', payment.id);
      });

      const updateResults = await Promise.all(updatePromises);

      // 5. التحقق من النتائج
      const errors = updateResults.filter(result => result.error);
      const successful = updateResults.filter(result => !result.error);

      console.log(`✅ تم تحديث ${successful.length} مدفوعات بنجاح`);
      if (errors.length > 0) {
        console.error(`❌ فشل في تحديث ${errors.length} مدفوعات`);
      }

      // 6. عرض النتائج النهائية
      const { data: updatedPayments } = await supabase
        .from('unified_payments')
        .select('id, amount, original_due_date, status, days_overdue, late_fine_amount, description')
        .eq('lease_id', agreement.id)
        .eq('status', 'overdue')
        .order('original_due_date');

      console.log('📊 المدفوعات المتأخرة بعد التحديث:');
      updatedPayments?.forEach(payment => {
        const dueDate = new Date(payment.original_due_date).toLocaleDateString('ar-QA');
        console.log(`- ${payment.description}: ${payment.amount} ر.ق - مستحقة ${dueDate} - متأخرة ${payment.days_overdue} يوم - غرامة ${payment.late_fine_amount} ر.ق`);
      });

      return {
        success: true,
        message: `تم تحديث ${successful.length} مدفوعات إلى حالة متأخرة`,
        overduePaymentsCount: updatedPayments?.length || 0,
        totalOverdueAmount: updatedPayments?.reduce((sum, p) => sum + p.amount, 0) || 0,
        totalLateFees: updatedPayments?.reduce((sum, p) => sum + (p.late_fine_amount || 0), 0) || 0,
        payments: updatedPayments
      };

    } catch (error) {
      console.error('❌ خطأ غير متوقع:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const handleFixPayments = async () => {
    setIsLoading(true);
    try {
      const result = await fixPaymentStatusForAgreement('AGR-202504-421408');
      setResults(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(`خطأ: ${result.error}`);
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>إصلاح حالة المدفوعات - العقد AGR-202504-421408</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleFixPayments}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'جاري التحديث...' : 'إصلاح حالة المدفوعات المتأخرة'}
            </Button>

            {results && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {results.success ? '✅ نتائج الإصلاح' : '❌ خطأ في الإصلاح'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>الرسالة:</strong> {results.message}</p>
                    
                    {results.success && results.overduePaymentsCount > 0 && (
                      <>
                        <p><strong>عدد المدفوعات المتأخرة:</strong> {results.overduePaymentsCount}</p>
                        <p><strong>إجمالي المبلغ المتأخر:</strong> {results.totalOverdueAmount?.toLocaleString()} ر.ق</p>
                        <p><strong>إجمالي الغرامات:</strong> {results.totalLateFees?.toLocaleString()} ر.ق</p>
                        
                        {results.payments && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">تفاصيل المدفوعات المتأخرة:</h4>
                            <div className="space-y-1 text-sm">
                              {results.payments.map((payment: any) => (
                                <div key={payment.id} className="border p-2 rounded">
                                  <p><strong>{payment.description}</strong></p>
                                  <p>المبلغ: {payment.amount.toLocaleString()} ر.ق</p>
                                  <p>تاريخ الاستحقاق: {new Date(payment.original_due_date).toLocaleDateString('ar-QA')}</p>
                                  <p>أيام التأخير: {payment.days_overdue}</p>
                                  <p>غرامة التأخير: {payment.late_fine_amount?.toLocaleString()} ر.ق</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    {results.error && (
                      <p className="text-red-600"><strong>خطأ:</strong> {results.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 