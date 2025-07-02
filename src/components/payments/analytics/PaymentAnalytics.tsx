
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import { TrendingUp, DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface PaymentAnalyticsProps {
  amountPaid: number;
  balance: number;
  lateFees: number;
  totalAmount?: number;
  paidOnTime?: number;
  paidLate?: number;
  unpaid?: number;
}

// Helper function to format currency in Arabic style with English digits
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(amount);
};

export function PaymentAnalytics({ 
  amountPaid, 
  balance, 
  lateFees, 
  totalAmount = 0,
  paidOnTime = 0,
  paidLate = 0,
  unpaid = 0
}: PaymentAnalyticsProps) {
  const paymentProgress = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;
  const totalPayments = paidOnTime + paidLate + unpaid;
  const onTimePercentage = totalPayments > 0 ? (paidOnTime / totalPayments) * 100 : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Main Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-r-4 border-r-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">إجمالي المدفوع</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(amountPaid)} ر.ق</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">الرصيد المتبقي</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(balance)} ر.ق</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-medium text-red-600">رسوم التأخير</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(lateFees)} ر.ق</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2 flex-row-reverse">
            <TrendingUp className="h-5 w-5" />
            تقدم المدفوعات
          </CardTitle>
          <CardDescription className="text-right">تتبع حالة إكمال المدفوعات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{paymentProgress.toFixed(1)}%</span>
              <span>إكمال العقد</span>
            </div>
            <Progress value={paymentProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(totalAmount)} ر.ق الإجمالي</span>
              <span>{formatCurrency(amountPaid)} ر.ق مدفوع</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 flex-row-reverse">
              <CheckCircle className="h-5 w-5 text-green-600" />
              أداء المدفوعات
            </CardTitle>
            <CardDescription className="text-right">إحصائيات الدفع في الوقت المحدد</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={onTimePercentage >= 80 ? "default" : onTimePercentage >= 60 ? "secondary" : "destructive"}>
                  {onTimePercentage.toFixed(1)}%
                </Badge>
                <span className="text-sm font-medium">معدل الدفع في الوقت المحدد</span>
              </div>
              <div className="space-y-2">
                <Progress value={onTimePercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{paidOnTime}</div>
                  <div className="text-muted-foreground">في الوقت المحدد</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-orange-600">{paidLate}</div>
                  <div className="text-muted-foreground">متأخر</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{unpaid}</div>
                  <div className="text-muted-foreground">غير مدفوع</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 flex-row-reverse">
              <Clock className="h-5 w-5 text-blue-600" />
              ملخص المدفوعات
            </CardTitle>
            <CardDescription className="text-right">نظرة سريعة على حالة المدفوعات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{totalPayments}</span>
                <span className="text-sm">إجمالي المدفوعات</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">{paymentProgress.toFixed(1)}%</span>
                <span className="text-sm">نسبة إكمال المدفوعات</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-red-600">{formatCurrency(balance + lateFees)} ر.ق</span>
                <span className="text-sm">المبلغ المستحق</span>
              </div>
              {lateFees > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-red-600">
                    +{((lateFees / totalAmount) * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm">تأثير رسوم التأخير</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle>حالة المدفوعات</CardTitle>
          <CardDescription className="text-right">تقييم عام لأداء المدفوعات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200 flex-row-reverse">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-right">
                <div className="font-medium text-green-800">حالة الدفع</div>
                <div className="text-sm text-green-600">
                  {balance === 0 ? 'مدفوع بالكامل' : paymentProgress >= 50 ? 'على المسار' : 'متأخر عن الجدول'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 flex-row-reverse">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div className="text-right">
                <div className="font-medium text-blue-800">اتجاه التقدم</div>
                <div className="text-sm text-blue-600">
                  {paymentProgress > 75 ? 'ممتاز' : paymentProgress > 50 ? 'جيد' : 'يحتاج انتباه'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200 flex-row-reverse">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="text-right">
                <div className="font-medium text-orange-800">مستوى المخاطر</div>
                <div className="text-sm text-orange-600">
                  {lateFees === 0 && onTimePercentage > 80 ? 'منخفض' : 
                   lateFees > 0 || onTimePercentage < 60 ? 'عالي' : 'متوسط'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
