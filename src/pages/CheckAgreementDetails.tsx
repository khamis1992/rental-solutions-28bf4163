import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, DollarSign, Calendar, Clock, Car, User, Loader2, Search } from 'lucide-react';

export default function CheckAgreementDetails() {
  const [agreementData, setAgreementData] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [trafficFinesData, setTrafficFinesData] = useState<any>(null);
  const [isCheckingFines, setIsCheckingFines] = useState(false);

  // العقد المطلوب فحصه
  const targetAgreementNumber = 'LTO2024141';

  useEffect(() => {
    fetchAgreementDetails();
  }, []);

  const fetchAgreementDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 البحث عن العقد: ${targetAgreementNumber}`);
      
      // البحث عن العقد مع بيانات العميل والمركبة
      const { data: agreementData, error: agreementError } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `)
        .eq('agreement_number', targetAgreementNumber)
        .maybeSingle();

      if (agreementError) {
        console.error('خطأ في جلب العقد:', agreementError);
        throw new Error(agreementError.message);
      }

      if (!agreementData) {
        setError(`العقد رقم ${targetAgreementNumber} غير موجود في النظام`);
        setIsLoading(false);
        return;
      }

      console.log('✅ تم العثور على العقد:', agreementData);
      setAgreementData(agreementData);

      // جلب جميع الدفعات المرتبطة بهذا العقد
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('lease_id', agreementData.id)
        .order('due_date', { ascending: true });

      if (paymentsError) {
        console.error('خطأ في جلب الدفعات:', paymentsError);
        // لا نتوقف هنا، قد لا توجد دفعات بعد
      }

      console.log('💰 الدفعات المجلبة:', paymentsData);
      setPaymentsData(paymentsData || []);

      // تحقق من وجود دفعات
      if (!paymentsData || paymentsData.length === 0) {
        console.log('⚠️ تحذير: لا توجد دفعات مسجلة لهذا العقد في جدول payments');
        // محاولة البحث في جداول أخرى
        const { data: altPayments } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', agreementData.id);
        
        if (altPayments && altPayments.length > 0) {
          console.log('📋 تم العثور على دفعات في unified_payments:', altPayments.length);
        }
      }

      // حساب الملخص المالي
      const summary = calculateFinancialSummary(agreementData, paymentsData || []);
      setFinancialSummary(summary);

    } catch (error: any) {
      console.error('خطأ عام:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFinancialSummary = (agreement: any, payments: any[]) => {
    const today = new Date();
    console.log(`🔍 التاريخ الحالي للمقارنة: ${today.toLocaleDateString('ar-QA')}`);
    
    let totalPaid = 0;
    let totalOverdue = 0;
    let totalPending = 0;
    let overduePayments: any[] = [];
    let pendingPayments: any[] = [];

    // تشخيص تفصيلي لكل دفعة
    payments.forEach((payment, index) => {
      const dueDate = new Date(payment.due_date);
      console.log(`💰 دفعة ${index + 1}:`, {
        description: payment.description || `دفعة ${index + 1}`,
        amount: payment.amount,
        status: payment.status,
        due_date: payment.due_date,
        due_date_formatted: dueDate.toLocaleDateString('ar-QA'),
        is_past_due: dueDate < today,
        days_difference: Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      });
      
      if (payment.status === 'paid' || payment.status === 'completed') {
        totalPaid += payment.amount;
        console.log(`✅ دفعة مدفوعة: ${payment.amount} ر.ق`);
      } else if (payment.status === 'overdue') {
        // الدفعات المصنفة بالفعل كمتأخرة
        totalOverdue += payment.amount;
        overduePayments.push(payment);
        console.log(`🚨 دفعة متأخرة (مصنفة): ${payment.amount} ر.ق`);
      } else if (payment.status === 'pending') {
        // فحص الدفعات المعلقة - هل هي متأخرة؟
        if (dueDate < today) {
          // دفعة معلقة ولكن تاريخ استحقاقها مضى = متأخرة
          totalOverdue += payment.amount;
          overduePayments.push(payment);
          console.log(`⚠️ دفعة معلقة ولكن متأخرة فعلياً: ${payment.amount} ر.ق`);
          console.log(`📅 تاريخ الاستحقاق: ${dueDate.toLocaleDateString('ar-QA')} (مضى منذ ${Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} يوم)`);
        } else {
          // دفعة معلقة وتاريخ استحقاقها لم يأتِ بعد
          totalPending += payment.amount;
          pendingPayments.push(payment);
          console.log(`⏳ دفعة معلقة (لم تستحق بعد): ${payment.amount} ر.ق`);
        }
      } else {
        console.log(`❓ دفعة بحالة غير معروفة: ${payment.status}`);
      }
    });

    // حساب غرامات التأخير (3000 ر.ق لكل شهر متأخر)
    const overdueMonthsCount = overduePayments.length;
    const totalLateFees = overdueMonthsCount * 3000;

    // إجمالي المبلغ المستحق
    const totalDue = totalOverdue + totalLateFees;

    console.log(`📊 ملخص الحسابات:`, {
      totalPaid: `${totalPaid.toLocaleString()} ر.ق`,
      totalOverdue: `${totalOverdue.toLocaleString()} ر.ق`,
      totalPending: `${totalPending.toLocaleString()} ر.ق`,
      overdueMonthsCount: `${overdueMonthsCount} شهر`,
      totalLateFees: `${totalLateFees.toLocaleString()} ر.ق`,
      totalDue: `${totalDue.toLocaleString()} ر.ق`
    });

    // إذا كانت دفعة يوليو 2024 موجودة، تحقق منها خصيصاً
    const julyPayment = payments.find(p => 
      p.description && p.description.toLowerCase().includes('july 2024')
    );
    
    if (julyPayment) {
      const julyDueDate = new Date(julyPayment.due_date);
      console.log(`🔍 فحص خاص لدفعة يوليو 2024:`, {
        description: julyPayment.description,
        status: julyPayment.status,
        due_date: julyPayment.due_date,
        due_date_formatted: julyDueDate.toLocaleDateString('ar-QA'),
        should_be_overdue: julyDueDate < today ? 'نعم، يجب أن تكون متأخرة' : 'لا، لم تستحق بعد',
        days_overdue: Math.floor((today.getTime() - julyDueDate.getTime()) / (1000 * 60 * 60 * 24))
      });
    }

    // حالة الصحة المالية
    let financialHealth: 'excellent' | 'good' | 'attention' | 'critical';
    if (overduePayments.length === 0) {
      financialHealth = 'excellent';
    } else if (overduePayments.length <= 2) {
      financialHealth = 'attention';
    } else {
      financialHealth = 'critical';
    }

    return {
      totalPaid,
      totalOverdue,
      totalPending,
      totalLateFees,
      totalDue,
      overduePayments,
      pendingPayments,
      overdueMonthsCount,
      financialHealth,
      hasOverduePayments: overduePayments.length > 0,
      monthlyRent: agreement.rent_amount || 0
    };
  };

  const checkTrafficFines = async () => {
    setIsCheckingFines(true);
    setError(null);
    
    try {
      console.log(`🔍 فحص المخالفات المرورية: ${targetAgreementNumber}`);
      
      if (!agreementData) {
        throw new Error('بيانات العقد غير متوفرة');
      }
      
      // جلب جميع المخالفات المرورية في النظام
      const { data: allFines, error: allFinesError } = await supabase
        .from('traffic_fines')
        .select('*');

      if (allFinesError) {
        console.error('خطأ في جلب المخالفات المرورية:', allFinesError);
        throw new Error(allFinesError.message);
      }

      // جلب المخالفات المرورية لهذا العقد تحديداً
      const { data: agreementFines, error: agreementFinesError } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', agreementData.id);

      if (agreementFinesError) {
        console.error('خطأ في جلب مخالفات العقد:', agreementFinesError);
        throw new Error(agreementFinesError.message);
      }

      // تجهيز البيانات للعرض
      const totalFines = allFines?.length || 0;
      const finesForThisAgreement = agreementFines || [];
      const unassignedFines = allFines?.filter(fine => !fine.lease_id) || [];

      const result = {
        totalFines,
        finesForThisAgreement,
        unassignedFines,
        agreementId: agreementData.id,
        vehicleId: agreementData.vehicle_id,
        licensePlate: agreementData.vehicles?.license_plate || null
      };

      console.log('📊 نتائج فحص المخالفات:', result);
      setTrafficFinesData(result);

    } catch (error: any) {
      console.error('خطأ عام:', error);
      setError(error.message);
    } finally {
      setIsCheckingFines(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">جاري فحص العقد {targetAgreementNumber}...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-lg font-semibold">خطأ في البحث</p>
            </div>
            <p className="mt-2 text-gray-600">{error}</p>
            <Button onClick={fetchAgreementDetails} className="mt-4">
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'attention': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthText = (health: string) => {
    switch (health) {
      case 'excellent': return '✅ ممتاز - لا توجد متأخرات';
      case 'good': return '✅ جيد';  
      case 'attention': return '⚠️ يحتاج انتباه';
      case 'critical': return '🚨 حرج - متأخرات كبيرة';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">تقرير فحص العقد</h1>
        <p className="text-gray-600 mt-2">فحص المتأخرات المالية للعقد رقم: {targetAgreementNumber}</p>
      </div>

      {/* تحذير حول إصلاح مشكلة حساب المتأخرات */}
      <Card className="border-blue-200 bg-blue-50 mb-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">🔧 تم إصلاح مشكلة حساب المتأخرات</h3>
              <p className="text-blue-700 text-sm mb-2">
                <strong>المشكلة:</strong> كانت الدفعات المعلقة (pending) التي تجاوز تاريخ استحقاقها لا تُحسب كمتأخرات.
              </p>
              <p className="text-blue-700 text-sm mb-2">
                <strong>الإصلاح:</strong> الآن النظام يفحص كل دفعة معلقة ويحولها تلقائياً لمتأخرة إذا مضى تاريخ استحقاقها.
              </p>
              <p className="text-blue-700 text-sm">
                <strong>مثال:</strong> دفعة "Monthly Rent - July 2024" إذا كانت معلقة ومضى شهر يوليو، ستُحسب الآن كمتأخرة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* حالة العقد العامة */}
      <Card className={`border-2 ${financialSummary?.hasOverduePayments ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {financialSummary?.hasOverduePayments ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            نتيجة الفحص
          </CardTitle>
        </CardHeader>
        <CardContent>
          {financialSummary?.hasOverduePayments ? (
            <div className="space-y-2">
              <p className="text-xl font-bold text-red-800">
                🚨 يوجد متأخرات مالية على هذا العقد
              </p>
              <p className="text-red-700">
                عدد الأشهر المتأخرة: {financialSummary.overdueMonthsCount} شهر
              </p>
              <p className="text-red-700">
                إجمالي المبلغ المستحق: {financialSummary.totalDue.toLocaleString()} ر.ق
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xl font-bold text-green-800">
                ✅ لا توجد متأخرات مالية على هذا العقد
              </p>
              <p className="text-green-700">
                جميع الدفعات محدثة والوضع المالي ممتاز
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تفاصيل العقد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            تفاصيل العقد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">رقم العقد:</span>
                <span className="font-semibold">{agreementData.agreement_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الإيجار الشهري:</span>
                <span className="font-semibold">{agreementData.rent_amount?.toLocaleString()} ر.ق</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">تاريخ البداية:</span>
                <span className="font-semibold">{new Date(agreementData.start_date).toLocaleDateString('ar-QA')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">تاريخ النهاية:</span>
                <span className="font-semibold">{new Date(agreementData.end_date).toLocaleDateString('ar-QA')}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">اسم العميل:</span>
                <span className="font-semibold">{agreementData.customers?.full_name || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">رقم اللوحة:</span>
                <span className="font-semibold">{agreementData.vehicles?.license_plate || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">حالة العقد:</span>
                <Badge variant={agreementData.status === 'active' ? 'default' : 'secondary'}>
                  {agreementData.status === 'active' ? 'نشط' : agreementData.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الحالة المالية:</span>
                <Badge className={getHealthColor(financialSummary?.financialHealth || 'good')}>
                  {getHealthText(financialSummary?.financialHealth || 'good')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الملخص المالي */}
      {financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي المدفوع</p>
                  <p className="text-xl font-bold text-green-600">
                    {financialSummary.totalPaid.toLocaleString()} ر.ق
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">معلق</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {financialSummary.totalPending.toLocaleString()} ر.ق
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">متأخر</p>
                  <p className="text-xl font-bold text-red-600">
                    {financialSummary.totalOverdue.toLocaleString()} ر.ق
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* تفاصيل المتأخرات (إن وجدت) */}
      {financialSummary?.hasOverduePayments && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <DollarSign className="h-5 w-5" />
              تفاصيل المتأخرات المالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 mb-1">المبلغ الأساسي المتأخر</p>
                  <p className="text-2xl font-bold text-red-800">
                    {financialSummary.totalOverdue.toLocaleString()} ر.ق
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {financialSummary.overdueMonthsCount} دفعات متأخرة
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 mb-1">غرامات التأخير</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {financialSummary.totalLateFees.toLocaleString()} ر.ق
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    {financialSummary.overdueMonthsCount} × 3,000 ر.ق
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">إجمالي المبلغ المطلوب:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {financialSummary.totalDue.toLocaleString()} ر.ق
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* تفاصيل جميع الدفعات للتشخيص */}
      {paymentsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              تفاصيل جميع الدفعات (تشخيص مفصل)
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              مقارنة بين الحالة المخزنة في قاعدة البيانات والحالة المحسوبة الصحيحة بناءً على التاريخ الحالي
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-right text-sm font-semibold">الوصف</th>
                    <th className="border border-gray-300 p-2 text-center text-sm font-semibold">المبلغ</th>
                    <th className="border border-gray-300 p-2 text-center text-sm font-semibold">تاريخ الاستحقاق</th>
                    <th className="border border-gray-300 p-2 text-center text-sm font-semibold">الحالة الحالية</th>
                    <th className="border border-gray-300 p-2 text-center text-sm font-semibold">الحالة المحسوبة</th>
                    <th className="border border-gray-300 p-2 text-center text-sm font-semibold">الأيام</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsData.map((payment, index) => {
                    const dueDate = new Date(payment.due_date);
                    const today = new Date();
                    const daysDifference = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                    const isPastDue = dueDate < today;
                    
                    let computedStatus = '';
                    let statusColor = '';
                    
                    if (payment.status === 'paid' || payment.status === 'completed') {
                      computedStatus = 'مدفوعة ✅';
                      statusColor = 'text-green-600 bg-green-50';
                    } else if (payment.status === 'overdue') {
                      computedStatus = 'متأخرة 🚨';
                      statusColor = 'text-red-600 bg-red-50';
                    } else if (payment.status === 'pending' && isPastDue) {
                      computedStatus = 'متأخرة فعلياً ⚠️';
                      statusColor = 'text-red-600 bg-red-50';
                    } else if (payment.status === 'pending') {
                      computedStatus = 'معلقة ⏳';
                      statusColor = 'text-yellow-600 bg-yellow-50';
                    } else {
                      computedStatus = 'غير محدد ❓';
                      statusColor = 'text-gray-600 bg-gray-50';
                    }

                    return (
                      <tr key={payment.id || index} className={isPastDue && payment.status === 'pending' ? 'bg-red-50' : ''}>
                        <td className="border border-gray-300 p-2 text-right text-sm">
                          {payment.description || `دفعة ${index + 1}`}
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-sm font-semibold">
                          {payment.amount?.toLocaleString()} ر.ق
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-sm">
                          {dueDate.toLocaleDateString('ar-QA')}
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                            payment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className={`border border-gray-300 p-2 text-center text-sm ${statusColor}`}>
                          <span className="px-2 py-1 rounded text-xs font-semibold">
                            {computedStatus}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-sm">
                          {isPastDue ? (
                            <span className="text-red-600 font-semibold">
                              +{daysDifference} يوم
                            </span>
                          ) : (
                            <span className="text-green-600">
                              -{Math.abs(daysDifference)} يوم
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* إحصائيات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات إضافية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">عدد الدفعات الكلي: <span className="font-semibold">{paymentsData.length}</span></p>
              <p className="text-gray-600">عدد الدفعات المدفوعة: <span className="font-semibold text-green-600">{paymentsData.filter(p => p.status === 'paid').length}</span></p>
            </div>
            <div>
              <p className="text-gray-600">عدد الدفعات المتأخرة: <span className="font-semibold text-red-600">{financialSummary?.overduePayments.length || 0}</span></p>
              <p className="text-gray-600">عدد الدفعات المعلقة: <span className="font-semibold text-yellow-600">{financialSummary?.pendingPayments.length || 0}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات الدفعات */}
      {financialSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              الملخص المالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي المدفوع:</span>
                  <span className="font-semibold text-green-600">
                    {financialSummary.totalPaid.toLocaleString()} ر.ق
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي المعلق:</span>
                  <span className="font-semibold text-yellow-600">
                    {financialSummary.totalPending.toLocaleString()} ر.ق
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي المتأخر:</span>
                  <span className="font-semibold text-red-600">
                    {financialSummary.totalOverdue.toLocaleString()} ر.ق
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد الدفعات المكتملة:</span>
                  <span className="font-semibold">{financialSummary.completedPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد الدفعات المعلقة:</span>
                  <span className="font-semibold">{financialSummary.pendingPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد الدفعات المتأخرة:</span>
                  <span className="font-semibold">{financialSummary.overduePayments}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">الحالة المالية:</span>
                  <Badge className={getHealthColor(financialSummary.financialHealth)}>
                    {getHealthText(financialSummary.financialHealth)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">نسبة التقدم:</span>
                  <span className="font-semibold">{financialSummary.progressPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* فحص المخالفات المرورية - قسم جديد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            فحص المخالفات المرورية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">🔍 تشخيص مشكلة المخالفات المرورية</h4>
              <p className="text-blue-700 text-sm">
                سيتم فحص ربط المخالفات المرورية بالعقد وإظهار التفاصيل الكاملة لحل المشكلة.
              </p>
            </div>
            
            {/* عرض معرف العقد */}
            {agreementData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">معرف العقد في قاعدة البيانات:</p>
                  <p className="font-mono text-sm bg-white p-2 rounded border">
                    {agreementData.id}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">رقم العقد:</p>
                  <p className="font-mono text-sm bg-white p-2 rounded border">
                    {agreementData.agreement_number}
                  </p>
                </div>
              </div>
            )}
            
            {/* زر فحص المخالفات */}
            <Button 
              onClick={checkTrafficFines} 
              disabled={!agreementData || isCheckingFines}
              className="w-full"
            >
              {isCheckingFines ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري فحص المخالفات المرورية...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  فحص المخالفات المرورية لهذا العقد
                </>
              )}
            </Button>
            
            {/* نتائج فحص المخالفات */}
            {trafficFinesData && (
              <div className="mt-4 space-y-3">
                <h5 className="font-semibold">📊 نتائج فحص المخالفات المرورية:</h5>
                
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-green-800">إجمالي المخالفات الموجودة في النظام:</span>
                    <Badge className="bg-green-500">{trafficFinesData.totalFines}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-800">المخالفات المربوطة بهذا العقد:</span>
                    <Badge className={trafficFinesData.finesForThisAgreement.length > 0 ? "bg-blue-500" : "bg-red-500"}>
                      {trafficFinesData.finesForThisAgreement.length}
                    </Badge>
                  </div>
                  
                  {trafficFinesData.finesForThisAgreement.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-green-700 mb-2">✅ المخالفات المربوطة بهذا العقد:</p>
                      <div className="space-y-2">
                        {trafficFinesData.finesForThisAgreement.map((fine: any, index: number) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">رقم المخالفة:</span>
                                <span className="font-mono ml-2">{fine.violation_number || 'غير محدد'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">المبلغ:</span>
                                <span className="font-semibold ml-2">{fine.fine_amount?.toLocaleString() || 0} ر.ق</span>
                              </div>
                              <div>
                                <span className="text-gray-600">تاريخ المخالفة:</span>
                                <span className="ml-2">{fine.violation_date ? new Date(fine.violation_date).toLocaleDateString('ar-QA') : 'غير محدد'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">حالة الدفع:</span>
                                <Badge variant="outline" className="ml-2">{fine.payment_status || 'غير محدد'}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {trafficFinesData.finesForThisAgreement.length === 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 font-semibold">⚠️ لا توجد مخالفات مرورية مربوطة بهذا العقد</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        السبب المحتمل: المخالفات غير مربوطة بمعرف العقد أو لا توجد مخالفات مسجلة.
                      </p>
                    </div>
                  )}
                  
                  {/* إظهار معرف المركبة للبحث */}
                  {agreementData?.vehicles && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-blue-800 font-semibold mb-2">🚗 معلومات المركبة:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">رقم اللوحة:</span>
                          <span className="font-mono ml-2">{agreementData.vehicles.license_plate}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">معرف المركبة:</span>
                          <span className="font-mono ml-2">{agreementData.vehicle_id}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* المخالفات غير المربوطة */}
                  {trafficFinesData.unassignedFines.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 font-semibold mb-2">⚠️ مخالفات غير مربوطة ({trafficFinesData.unassignedFines.length}):</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {trafficFinesData.unassignedFines.map((fine: any, index: number) => (
                          <div key={index} className="bg-white p-2 rounded border text-sm">
                            <div className="flex justify-between">
                              <span>لوحة: {fine.license_plate}</span>
                              <span>مبلغ: {fine.fine_amount?.toLocaleString() || 0} ر.ق</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {trafficFinesData.totalFines === 0 && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-gray-800 font-semibold">ℹ️ لا توجد مخالفات مرورية في النظام</p>
                      <p className="text-gray-600 text-sm mt-1">
                        لم يتم تسجيل أي مخالفات مرورية في قاعدة البيانات بعد.
                      </p>
                    </div>
                  )}
                  
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* زر التحديث */}
      <div className="text-center">
        <Button onClick={fetchAgreementDetails} className="px-8">
          إعادة فحص العقد
        </Button>
      </div>
    </div>
  );
} 