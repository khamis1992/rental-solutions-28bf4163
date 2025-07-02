

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { FileText, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/formatters';
import { VehicleData } from '@/types/vehicle.types';
import { AgreementHistoryTab } from '../AgreementHistoryTab';
import { useNavigate } from 'react-router-dom';

interface VehicleRentalTabProps {
  vehicle: VehicleData;
}

export const VehicleRentalTab: React.FC<VehicleRentalTabProps> = ({ vehicle }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isAvailable = vehicle.status === 'available';

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Rental Status and Pricing */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <DollarSign className="h-5 w-5" />
              {language === 'ar' ? 'معلومات التسعير' : 'Pricing Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className={language === 'ar' ? 'text-right' : ''}>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'السعر اليومي' : 'Daily Rate'}</p>
                <p className="text-2xl font-bold">
                  {vehicle.rent_amount ? `${formatCurrency(vehicle.rent_amount)} ${language === 'ar' ? 'ر.ق' : 'QAR'}` : (language === 'ar' ? 'غير محدد' : 'Not set')}
                </p>
              </div>
              {isAvailable && (
                <Button 
                  onClick={() => navigate(`/agreements/new?vehicle_id=${vehicle.id}`)}
                  className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'إنشاء اتفاقية إيجار' : 'Create Rental Agreement'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <TrendingUp className="h-5 w-5" />
              {language === 'ar' ? 'إحصائيات الإيجار' : 'Rental Statistics'}
            </CardTitle>
          </CardHeader>
          <CardContent className={language === 'ar' ? 'text-right' : ''}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الاتفاقيات' : 'Total Agreements'}
                </span>
                <Badge variant="secondary">0</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الاتفاقيات النشطة' : 'Active Agreements'}
                </span>
                <Badge variant="default">0</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'معدل الاستخدام' : 'Utilization Rate'}
                </span>
                <Badge variant="outline">0%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental Availability */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            <Calendar className="h-5 w-5" />
            {language === 'ar' ? 'حالة التوافر' : 'Availability Status'}
          </CardTitle>
        </CardHeader>
        <CardContent className={language === 'ar' ? 'text-right' : ''}>
          <div className="flex items-center gap-4">
            <Badge 
              variant={isAvailable ? "default" : "secondary"}
              className="px-3 py-1"
            >
              {isAvailable ? 
                (language === 'ar' ? 'متاحة للإيجار' : 'Available for Rent') : 
                (language === 'ar' ? 'غير متاحة' : 'Not Available')
              }
            </Badge>
            <p className="text-sm text-muted-foreground">
              {isAvailable ? 
                (language === 'ar' ? 'هذه المركبة متاحة حالياً لإنشاء اتفاقية إيجار جديدة' : 'This vehicle is currently available for new rental agreements') :
                (language === 'ar' ? 'هذه المركبة غير متاحة حالياً للإيجار' : 'This vehicle is currently not available for rent')
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Agreement History */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            <FileText className="h-5 w-5" />
            {language === 'ar' ? 'تاريخ الاتفاقيات' : 'Agreement History'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'جميع اتفاقيات الإيجار المرتبطة بهذه المركبة' : 'All rental agreements associated with this vehicle'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgreementHistoryTab vehicleId={vehicle.id} />
        </CardContent>
      </Card>
    </div>
  );
};
