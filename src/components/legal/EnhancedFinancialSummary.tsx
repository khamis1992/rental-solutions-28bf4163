import { Card, CardContent } from '@/components/ui/card';

interface EnhancedFinancialSummaryProps {
  overduePaymentsCount: number;
  monthlyRentAmount: number;
  totalOverdueAmount: number;
  totalLateFees: number;
  grandTotal: number;
}

export function EnhancedFinancialSummary({
  overduePaymentsCount,
  monthlyRentAmount,
  totalOverdueAmount,
  totalLateFees,
  grandTotal
}: EnhancedFinancialSummaryProps) {
  return (
    <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-red-800 mb-2">
            الملخص المالي للمطالبة القانونية
          </h3>
          <div className="w-16 h-1 bg-red-500 mx-auto"></div>
        </div>

        <div className="space-y-4">
          {/* المبلغ الأساسي المتأخر */}
          <div className="flex justify-between items-center p-4 bg-white/70 rounded-lg border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div>
                <p className="font-semibold text-gray-800">إجمالي المتأخرات الأساسية</p>
                <p className="text-sm text-gray-600">
                  {overduePaymentsCount} دفعات × {monthlyRentAmount.toLocaleString()} ر.ق
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-red-600">
                {totalOverdueAmount.toLocaleString()} ر.ق
              </p>
            </div>
          </div>

          {/* غرامات التأخير */}
          <div className="flex justify-between items-center p-4 bg-white/70 rounded-lg border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <div>
                <p className="font-semibold text-gray-800">إجمالي رسوم التأخير</p>
                <p className="text-sm text-gray-600">
                  {overduePaymentsCount} أشهر × 3,000 ر.ق (حد أقصى/شهر)
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-orange-600">
                {totalLateFees.toLocaleString()} ر.ق
              </p>
            </div>
          </div>

          {/* خط فاصل */}
          <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

          {/* الإجمالي الكلي */}
          <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-100 to-red-100 rounded-lg border-2 border-purple-300">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">∑</span>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-800">إجمالي المبلغ المطالب به</p>
                <p className="text-sm text-purple-600">
                  المتأخرات + رسوم التأخير
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-purple-700">
                {grandTotal.toLocaleString()} ر.ق
              </p>
              <p className="text-sm text-purple-600 mt-1">
                ({totalOverdueAmount.toLocaleString()} + {totalLateFees.toLocaleString()})
              </p>
            </div>
          </div>

          {/* ملاحظة توضيحية */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs">ℹ</span>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">طريقة الحساب:</p>
                <p>• رسوم التأخير: 120 ر.ق/يوم بحد أقصى 3,000 ر.ق لكل شهر</p>
                <p>• المبلغ النهائي يشمل أصل الدين وجميع الغرامات المترتبة</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 