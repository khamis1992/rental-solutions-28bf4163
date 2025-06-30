import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CheckAgreementDetails() {
  const [agreementData, setAgreementData] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const checkAgreement = async () => {
    setIsLoading(true);
    try {
      // 1. جلب بيانات العقد
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          rent_amount,
          start_date,
          end_date,
          status,
          daily_late_fee,
          profiles:customer_id (full_name, phone_number),
          vehicles:vehicle_id (license_plate, make, model)
        `)
        .eq('agreement_number', 'AGR-202504-421408')
        .single();

      if (agreementError) {
        console.error('خطأ في جلب العقد:', agreementError);
        return;
      }

      setAgreementData(agreement);

      // 2. جلب جميع المدفوعات للعقد
      const { data: payments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select(`
          id,
          amount,
          amount_paid,
          balance,
          original_due_date,
          payment_date,
          status,
          description,
          days_overdue,
          late_fine_amount,
          type
        `)
        .eq('lease_id', agreement.id)
        .order('original_due_date');

      if (paymentsError) {
        console.error('خطأ في جلب المدفوعات:', paymentsError);
        return;
      }

      setPaymentsData(payments || []);

    } catch (error) {
      console.error('خطأ:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAgreement();
  }, []);

  const calculateTotals = () => {
    const totalPayments = paymentsData.length;
    const pendingPayments = paymentsData.filter(p => p.status === 'pending');
    const overduePayments = paymentsData.filter(p => p.status === 'overdue');
    const completedPayments = paymentsData.filter(p => p.status === 'completed' || p.status === 'paid');

    const totalAmount = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
    const overdueAmount = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalLateFees = overduePayments.reduce((sum, p) => sum + (p.late_fine_amount || 0), 0);

    return {
      totalPayments,
      pendingCount: pendingPayments.length,
      overdueCount: overduePayments.length,
      completedCount: completedPayments.length,
      totalAmount,
      overdueAmount,
      totalLateFees,
      grandTotal: overdueAmount + totalLateFees
    };
  };

  const totals = calculateTotals();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل العقد AGR-202504-421408</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>جاري التحميل...</p>}
          
          {agreementData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">بيانات العقد:</h3>
                  <p>رقم العقد: {agreementData.agreement_number}</p>
                  <p>قيمة الإيجار الشهري: {agreementData.rent_amount?.toLocaleString()} ر.ق</p>
                  <p>تاريخ البداية: {new Date(agreementData.start_date).toLocaleDateString('ar-QA')}</p>
                  <p>تاريخ النهاية: {new Date(agreementData.end_date).toLocaleDateString('ar-QA')}</p>
                  <p>حالة العقد: {agreementData.status}</p>
                  <p>غرامة التأخير اليومية: {agreementData.daily_late_fee} ر.ق</p>
                </div>
                <div>
                  <h3 className="font-semibold">بيانات العميل:</h3>
                  <p>الاسم: {agreementData.profiles?.full_name}</p>
                  <p>الهاتف: {agreementData.profiles?.phone_number}</p>
                  <h3 className="font-semibold mt-4">بيانات المركبة:</h3>
                  <p>رقم اللوحة: {agreementData.vehicles?.license_plate}</p>
                  <p>النوع: {agreementData.vehicles?.make} {agreementData.vehicles?.model}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ملخص المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totals.totalPayments}</p>
              <p className="text-sm">إجمالي الدفعات</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{totals.pendingCount}</p>
              <p className="text-sm">معلقة</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{totals.overdueCount}</p>
              <p className="text-sm">متأخرة</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{totals.completedCount}</p>
              <p className="text-sm">مدفوعة</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{totals.overdueAmount.toLocaleString()} ر.ق</p>
              <p className="text-sm">المبلغ الأساسي المتأخر</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">{totals.totalLateFees.toLocaleString()} ر.ق</p>
              <p className="text-sm">غرامات التأخير</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600">{totals.grandTotal.toLocaleString()} ر.ق</p>
              <p className="text-sm">الإجمالي الكلي</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل كل دفعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {paymentsData.map((payment, index) => {
              const dueDate = new Date(payment.original_due_date);
              const today = new Date();
              const isOverdue = payment.status === 'overdue';
              
              return (
                <div key={payment.id} className={`p-3 border rounded ${
                  payment.status === 'overdue' ? 'border-red-300 bg-red-50' :
                  payment.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                  'border-green-300 bg-green-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{payment.description}</p>
                      <p className="text-sm">تاريخ الاستحقاق: {dueDate.toLocaleDateString('ar-QA')}</p>
                      {isOverdue && <p className="text-sm">أيام التأخير: {payment.days_overdue}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{payment.amount?.toLocaleString()} ر.ق</p>
                      <p className="text-sm">الحالة: {payment.status}</p>
                      {isOverdue && payment.late_fine_amount > 0 && (
                        <p className="text-sm text-red-600">غرامة: {payment.late_fine_amount?.toLocaleString()} ر.ق</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تحليل المشكلة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>السبب في الرقم 12,000 ر.ق:</strong></p>
            <p>• إذا كان هذا المبلغ الأساسي فقط: {totals.overdueCount} دفعات × {agreementData?.rent_amount?.toLocaleString()} ر.ق = {(totals.overdueCount * (agreementData?.rent_amount || 0)).toLocaleString()} ر.ق</p>
            <p>• غرامات التأخير المفترضة: {totals.overdueCount} أشهر × 3,000 ر.ق = {(totals.overdueCount * 3000).toLocaleString()} ر.ق</p>
            <p>• الإجمالي المفترض: {((totals.overdueCount * (agreementData?.rent_amount || 0)) + (totals.overdueCount * 3000)).toLocaleString()} ر.ق</p>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded">
              <p><strong>الاستنتاج:</strong></p>
              <p>إذا كان المبلغ 12,000 ر.ق يشمل فقط المبلغ الأساسي، فهذا صحيح.</p>
              <p>لكن يجب إضافة غرامات التأخير للحصول على الإجمالي الكامل.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={checkAgreement} disabled={isLoading}>
        {isLoading ? 'جاري التحديث...' : 'تحديث البيانات'}
      </Button>
    </div>
  );
} 