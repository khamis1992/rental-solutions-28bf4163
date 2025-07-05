import { EnhancedFinancialSummary } from '@/components/legal/EnhancedFinancialSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function FinancialSummaryDemo() {
  const [demoData, setDemoData] = useState({
    overduePaymentsCount: 6,
    monthlyRentAmount: 2000,
    totalOverdueAmount: 12000,
    totalLateFees: 18000,
    grandTotal: 30000
  });

  const exampleScenarios = [
    {
      name: "العقد AGR-202504-421408 (المثال الحقيقي)",
      data: {
        overduePaymentsCount: 6,
        monthlyRentAmount: 2000,
        totalOverdueAmount: 12000,
        totalLateFees: 18000,
        grandTotal: 30000
      }
    },
    {
      name: "مثال آخر - عقد صغير",
      data: {
        overduePaymentsCount: 3,
        monthlyRentAmount: 1500,
        totalOverdueAmount: 4500,
        totalLateFees: 9000,
        grandTotal: 13500
      }
    },
    {
      name: "مثال عقد كبير",
      data: {
        overduePaymentsCount: 8,
        monthlyRentAmount: 3000,
        totalOverdueAmount: 24000,
        totalLateFees: 24000,
        grandTotal: 48000
      }
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            🎨 معاينة التصميم المحسن للملخص المالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {exampleScenarios.map((scenario, index) => (
              <Button
                key={index}
                variant={demoData === scenario.data ? "default" : "outline"}
                onClick={() => setDemoData(scenario.data)}
                className="h-auto p-4 text-wrap"
              >
                <div>
                  <p className="font-semibold">{scenario.name}</p>
                  <p className="text-xs opacity-75">
                    {scenario.data.overduePaymentsCount} دفعات - {scenario.data.grandTotal.toLocaleString()} ر.ق
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* عرض التصميم الجديد */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          التصميم الجديد المحسن ✨
        </h2>
        
        <EnhancedFinancialSummary
          overduePaymentsCount={demoData.overduePaymentsCount}
          monthlyRentAmount={demoData.monthlyRentAmount}
          totalOverdueAmount={demoData.totalOverdueAmount}
          totalLateFees={demoData.totalLateFees}
          grandTotal={demoData.grandTotal}
        />
      </div>

      {/* مقارنة مع التصميم القديم */}
      <Card>
        <CardHeader>
          <CardTitle>مقارنة مع التصميم القديم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* التصميم القديم (محاكاة) */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-600">❌ التصميم القديم</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">إجمالي رسوم التأخير</p>
                  <p className="text-2xl font-bold text-red-600">
                    {demoData.totalLateFees.toLocaleString()} ر.ق
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    رسوم تأخير محتسبة بـ 120 ر.ق/يوم (حد أقصى 3000 ر.ق)
                  </p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><strong>المشاكل:</strong></p>
                <p>• لا يوضح المبلغ الأساسي المتأخر</p>
                <p>• لا يظهر الإجمالي الكلي</p>
                <p>• غير واضح كيفية الحساب</p>
                <p>• لا يوضح عدد الدفعات المتأخرة</p>
              </div>
            </div>

            {/* التصميم الجديد */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">✅ التصميم الجديد</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-sm">المتأخرات الأساسية:</span>
                  <span className="font-bold text-red-600">{demoData.totalOverdueAmount.toLocaleString()} ر.ق</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-sm">رسوم التأخير:</span>
                  <span className="font-bold text-orange-600">{demoData.totalLateFees.toLocaleString()} ر.ق</span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center p-2 bg-purple-100 rounded font-bold">
                    <span>الإجمالي الكلي:</span>
                    <span className="text-purple-700">{demoData.grandTotal.toLocaleString()} ر.ق</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><strong>المزايا:</strong></p>
                <p>• وضوح كامل في التفاصيل</p>
                <p>• إظهار جميع المبالغ منفصلة</p>
                <p>• شرح طريقة الحساب</p>
                <p>• تصميم بصري جذاب ومنظم</p>
                <p>• سهولة في الفهم والمراجعة</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إرشادات التطبيق */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية تطبيق التصميم الجديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>1. في صفحة الشؤون القانونية:</strong></p>
            <p className="ml-4">استبدال المكون القديم بـ <code>EnhancedFinancialSummary</code></p>
            
            <p><strong>2. في تفاصيل العقد:</strong></p>
            <p className="ml-4">إضافة هذا المكون في قسم المدفوعات المتأخرة</p>
            
            <p><strong>3. في التقارير القانونية:</strong></p>
            <p className="ml-4">استخدام نفس التنسيق في PDF المُنتج</p>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="font-semibold text-blue-800">المطلوب منك:</p>
              <p className="text-blue-700">أخبرني أي التصاميم تفضل وأين تريد تطبيقه، وسأقوم بالتحديث!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 