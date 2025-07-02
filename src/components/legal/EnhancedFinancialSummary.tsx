
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { AlertTriangle, DollarSign, Clock, Car } from 'lucide-react';

interface EnhancedFinancialSummaryProps {
  overduePaymentsCount: number;
  monthlyRentAmount: number;
  totalOverdueAmount: number;
  totalLateFees: number;
  trafficFinesAmount?: number;
  grandTotal: number;
}

export function EnhancedFinancialSummary({
  overduePaymentsCount,
  monthlyRentAmount,
  totalOverdueAmount,
  totalLateFees,
  trafficFinesAmount = 0,
  grandTotal
}: EnhancedFinancialSummaryProps) {
  const finalTotal = totalOverdueAmount + totalLateFees + trafficFinesAmount;
  
  return (
    <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/80 to-orange-50/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-red-800">
            <AlertTriangle className="h-5 w-5" />
            الملخص المالي للمطالبة القانونية
          </CardTitle>
          <Badge variant="destructive" className="text-xs">
            {overduePaymentsCount} دفعات متأخرة
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* شبكة المبالغ الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* المتأخرات الأساسية */}
          <div className="bg-white/80 rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700">المتأخرات الأساسية</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {totalOverdueAmount.toLocaleString()} ر.ق
            </p>
            <p className="text-xs text-gray-500">
              {overduePaymentsCount} × {monthlyRentAmount.toLocaleString()}
            </p>
          </div>

          {/* رسوم التأخير */}
          <div className="bg-white/80 rounded-lg p-3 border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">رسوم التأخير</span>
            </div>
            <p className="text-lg font-bold text-orange-600">
              {totalLateFees.toLocaleString()} ر.ق
            </p>
            <p className="text-xs text-gray-500">
              {overduePaymentsCount} × 3,000 ر.ق
            </p>
          </div>

          {/* المخالفات المرورية */}
          <div className="bg-white/80 rounded-lg p-3 border border-yellow-100">
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">المخالفات المرورية</span>
            </div>
            <p className={`text-lg font-bold ${trafficFinesAmount > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
              {trafficFinesAmount.toLocaleString()} ر.ق
            </p>
            <p className="text-xs text-gray-500">
              {trafficFinesAmount > 0 ? 'مخالفات مترتبة' : 'لا توجد مخالفات'}
            </p>
          </div>
        </div>

        <Separator className="my-3" />

        {/* الإجمالي النهائي - مدمج */}
        <div className="bg-gradient-to-r from-purple-100 to-red-100 rounded-lg p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 rounded-full p-2">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-purple-800 text-lg">إجمالي المبلغ المطالب به</p>
                <p className="text-sm text-purple-600">
                  ({totalOverdueAmount.toLocaleString()} + {totalLateFees.toLocaleString()} + {trafficFinesAmount.toLocaleString()})
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-700">
                {finalTotal.toLocaleString()} ر.ق
              </p>
            </div>
          </div>
        </div>

        {/* ملاحظة مختصرة */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-start gap-2">
            <div className="bg-blue-500 rounded-full p-1 mt-0.5">
              <span className="text-white text-xs font-bold">ℹ</span>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">ملاحظة قانونية:</p>
              <p className="text-xs leading-relaxed">
                المبلغ يشمل أصل الدين (المتأخرات) + رسوم التأخير 3,000 ر.ق/شهر + المخالفات المرورية المترتبة على المستأجر حسب العقد.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 