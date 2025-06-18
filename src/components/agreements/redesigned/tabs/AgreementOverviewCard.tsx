
import React from 'react';
import { format } from 'date-fns';
import '@/styles/legal-rtl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Agreement } from '@/types/agreement';
import { User, Car, DollarSign, Clock } from 'lucide-react';

interface AgreementOverviewCardProps {
  agreement: Agreement;
  duration: number;
  rentAmount: number | null;
  contractAmount: number | null;
}

// Helper function to format currency without unnecessary decimals
const formatCurrency = (amount: number | null): string => {
  if (!amount) return 'N/A';
  const formatted = amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
  return `QAR ${formatted}`;
};

export function AgreementOverviewCard({ 
  agreement, 
  duration,
  rentAmount,
  contractAmount
}: AgreementOverviewCardProps) {
  return (
    <div className="space-y-6 legal-rtl" dir="rtl">
      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Info */}
        <Card>
          <CardContent className="p-4 text-right">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground text-right">العميل</p>
                <p className="font-semibold truncate text-right">
                  {agreement.customers?.full_name || 'عميل غير معروف'}
                </p>
              </div>
              <div className="bg-blue-500/10 rounded-full p-2">
                <User className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardContent className="p-4 text-right">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground text-right">المركبة</p>
                <p className="font-semibold truncate text-right">
                  {agreement.vehicles ? `${agreement.vehicles.make} ${agreement.vehicles.model}` : 'مركبة غير معروفة'}
                </p>
              </div>
              <div className="bg-green-500/10 rounded-full p-2">
                <Car className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardContent className="p-4 text-right">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground text-right">المدة</p>
                <p className="font-semibold text-right">
                  {duration} {duration === 1 ? 'شهر' : 'أشهر'}
                </p>
              </div>
              <div className="bg-purple-500/10 rounded-full p-2">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Amount */}
        <Card>
          <CardContent className="p-4 text-right">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground text-right">الإيجار الشهري</p>
                <p className="font-semibold text-right">
                  {rentAmount?.toLocaleString() || 0} ر.ق
                </p>
              </div>
              <div className="bg-amber-500/10 rounded-full p-2">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Customer & Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right" dir="rtl">
            <span>تفاصيل العميل والمركبة</span>
            <User className="h-5 w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-right" dir="rtl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information Section */}
            <div className="space-y-4 text-right">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-right justify-end">
                <span>معلومات العميل</span>
                <User className="h-5 w-5 text-blue-500" />
              </h3>
              <div className="space-y-3">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground text-right">الاسم الكامل</p>
                  <p className="font-medium text-right">{agreement.customers?.full_name || 'غير متوفر'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground text-right">رقم الهوية</p>
                  <p className="font-medium text-right">{agreement.customers?.driver_license || 'غير متوفر'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground text-right">رقم الهاتف</p>
                  <p className="font-medium text-right">{agreement.customers?.phone_number || 'غير متوفر'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground text-right">العنوان</p>
                  <p className="font-medium text-right">{agreement.customers?.address || 'غير متوفر'}</p>
                </div>
              </div>
            </div>

            {/* Vehicle Information Section */}
            <div className="space-y-4 text-right">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-right justify-end">
                <span>معلومات المركبة</span>
                <Car className="h-5 w-5 text-green-500" />
              </h3>
              <div className="space-y-3">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground text-right">الماركة والموديل</p>
                  <p className="font-medium text-right">
                    {agreement.vehicles ? `${agreement.vehicles.make} ${agreement.vehicles.model}` : 'غير متوفر'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground text-right">رقم اللوحة</p>
                  <p className="font-medium text-right">{agreement.vehicles?.license_plate || 'غير متوفر'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground text-right">سنة الصنع</p>
                  <p className="font-medium text-right">{agreement.vehicles?.year || 'غير متوفر'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground text-right">اللون</p>
                  <p className="font-medium text-right">{agreement.vehicles?.color || 'غير متوفر'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
