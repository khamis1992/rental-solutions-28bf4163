
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Calendar, DollarSign, FileText, MapPin, Wrench } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { VehicleData } from '@/types/vehicle.types';
import { useNavigate } from 'react-router-dom';

interface VehicleOverviewTabProps {
  vehicle: VehicleData;
  onMarkForMaintenance: () => void;
  onMarkAsAvailable: () => void;
}

export const VehicleOverviewTab: React.FC<VehicleOverviewTabProps> = ({
  vehicle,
  onMarkForMaintenance,
  onMarkAsAvailable
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const isAvailable = vehicle.status === 'available';
  const isInMaintenance = vehicle.status === 'maintenance';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'ar') {
      switch (status) {
        case 'available': return 'متاحة';
        case 'rented': return 'مؤجرة';
        case 'maintenance': return 'صيانة';
        case 'out_of_service': return 'خارج الخدمة';
        default: return status;
      }
    }
    return status;
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Status and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Car className="h-5 w-5" />
              {language === 'ar' ? 'حالة المركبة' : 'Vehicle Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`${getStatusColor(vehicle.status)} px-3 py-1 text-sm font-medium`}>
              {getStatusText(vehicle.status)}
            </Badge>
            <div className={`mt-4 space-y-2 ${language === 'ar' ? 'text-right' : ''}`}>
              {isAvailable && (
                <Button 
                  onClick={() => navigate(`/agreements/new?vehicle_id=${vehicle.id}`)}
                  className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'إنشاء اتفاقية' : 'Create Agreement'}
                </Button>
              )}
              {isInMaintenance && (
                <Button 
                  onClick={onMarkAsAvailable}
                  className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <Car className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'تعيين كمتاحة' : 'Mark as Available'}
                </Button>
              )}
              {!isInMaintenance && (
                <Button 
                  variant="outline" 
                  onClick={onMarkForMaintenance}
                  className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <Wrench className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'تعيين للصيانة' : 'Mark for Maintenance'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <DollarSign className="h-5 w-5" />
              {language === 'ar' ? 'معلومات الإيجار' : 'Rental Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className={language === 'ar' ? 'text-right' : ''}>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'السعر اليومي' : 'Daily Rate'}
                </p>
                <p className="text-lg font-semibold">
                  {vehicle.rent_amount ? `${formatCurrency(vehicle.rent_amount)} ${language === 'ar' ? 'ر.ق' : 'QAR'}` : (language === 'ar' ? 'غير محدد' : 'Not set')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'معلومات المركبة' : 'Vehicle Information'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'التفاصيل الأساسية للمركبة' : 'Basic vehicle details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'الماركة' : 'Make'}</p>
              <p className="text-base font-semibold">{vehicle.make || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'الموديل' : 'Model'}</p>
              <p className="text-base font-semibold">{vehicle.model || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'السنة' : 'Year'}</p>
              <p className="text-base font-semibold">{vehicle.year || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'اللون' : 'Color'}</p>
              <p className="text-base font-semibold">{vehicle.color || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'لوحة الترخيص' : 'License Plate'}</p>
              <p className="text-base font-semibold">{vehicle.license_plate || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'رقم الهيكل' : 'VIN'}</p>
              <p className="text-base font-semibold">{vehicle.vin || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <MapPin className="h-5 w-5" />
              {language === 'ar' ? 'معلومات إضافية' : 'Additional Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className={language === 'ar' ? 'text-right' : ''}>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'عداد المسافة' : 'Mileage'}</p>
                <p className="font-medium">
                  {vehicle.mileage ? `${vehicle.mileage} ${language === 'ar' ? 'كم' : 'km'}` : (language === 'ar' ? 'غير مسجل' : 'Not recorded')}
                </p>
              </div>
              {vehicle.inspection_expiry && (
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'انتهاء الفحص' : 'Inspection Expiry'}</p>
                  <p className="font-medium">{formatDate(vehicle.inspection_expiry)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Calendar className="h-5 w-5" />
              {language === 'ar' ? 'تواريخ مهمة' : 'Important Dates'}
            </CardTitle>
          </CardHeader>
          <CardContent className={language === 'ar' ? 'text-right' : ''}>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</p>
                <p className="font-medium">{formatDate(vehicle.created_at)}</p>
              </div>
              {vehicle.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'آخر تحديث' : 'Last Updated'}</p>
                  <p className="font-medium">{formatDate(vehicle.updated_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
