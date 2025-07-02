
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { format } from 'date-fns';
import { CalendarDays, DollarSign, User, Car } from 'lucide-react';

interface AgreementOverviewCardProps {
  agreement: any;
  duration: number;
  rentAmount: number | null;
  contractAmount: number | null;
}

export function AgreementOverviewCard({ 
  agreement, 
  duration,
  rentAmount,
  contractAmount 
}: AgreementOverviewCardProps) {
  const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
  const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <CardTitle className="text-xl font-bold text-left">نظرة عامة على العقد</CardTitle>
              <CardDescription className="text-left mt-1">
                معلومات العقد الأساسية والتفاصيل المالية
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="px-3 py-1">
                {agreement.agreement_number || 'بدون رقم'}
              </Badge>
              <Badge 
                variant={agreement.status === 'active' ? 'default' : 'secondary'}
                className="px-3 py-1"
              >
                {agreement.status === 'active' ? 'نشط' : agreement.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Information Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Rental Period Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-left">
              <span className="text-left">فترة الإيجار</span>
              <CalendarDays className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">تاريخ البداية</p>
              <p className="font-medium">{format(startDate, "dd/MM/yyyy")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">تاريخ النهاية</p>
              <p className="font-medium">{format(endDate, "dd/MM/yyyy")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">المدة</p>
              <p className="font-medium">
                {duration} {duration === 1 ? 'شهر' : 'شهر'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-left">
              <span className="text-left">التفاصيل المالية</span>
              <DollarSign className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">الإيجار الشهري</p>
              <p className="font-medium text-lg">
                {rentAmount ? `${rentAmount.toLocaleString()} ر.ق` : 'غير محدد'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">إجمالي قيمة العقد</p>
              <p className="font-medium text-lg">
                {contractAmount ? `${contractAmount.toLocaleString()} ر.ق` : 'غير محدد'}
              </p>
            </div>
            {agreement.deposit_amount && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">مبلغ التأمين</p>
                <p className="font-medium">
                  {agreement.deposit_amount.toLocaleString()} ر.ق
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-left">
              <span className="text-left">معلومات العميل</span>
              <User className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">الاسم</p>
              <p className="font-medium">{agreement.customers?.full_name || 'غير متوفر'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="font-medium">{agreement.customers?.email || 'غير متوفر'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                              <p className="font-medium phone-number-ltr" dir="ltr">{agreement.customers?.phone_number || 'غير متوفر'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-left">
              <span className="text-left">معلومات المركبة</span>
              <Car className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">المركبة</p>
              <p className="font-medium">
                {agreement.vehicles ? 
                  `${agreement.vehicles.year || ''} ${agreement.vehicles.make || ''} ${agreement.vehicles.model || ''}`.trim() || 'غير محدد'
                  : 'لا توجد مركبة مخصصة'
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">رقم اللوحة</p>
              <p className="font-medium">{agreement.vehicles?.license_plate || 'غير متوفر'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">اللون</p>
              <p className="font-medium">{agreement.vehicles?.color || 'غير متوفر'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Details Card */}
      {agreement.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">ملاحظات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-right whitespace-pre-wrap">{agreement.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
