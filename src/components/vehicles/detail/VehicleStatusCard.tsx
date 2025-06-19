import React from 'react';
import { Car, FileText, Wrench, Plus } from 'lucide-react';
import { VehicleStatusBadge } from '@/components/vehicles/VehicleStatusBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { VehicleData } from '@/types/vehicle.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleStatusCardProps {
  vehicle: VehicleData;
}

export const VehicleStatusCard: React.FC<VehicleStatusCardProps> = ({ vehicle }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const isAvailable = vehicle.status === 'available';
  const isInMaintenance = vehicle.status === 'maintenance';
  const isRented = vehicle.status === 'rented';

  return (
    <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
        </CardTitle>
        <CardDescription className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'توفر المركبة وحالة الإيجار' : 'Vehicle availability and rental status'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'الحالة' : 'Status'}
            </span>
            <VehicleStatusBadge status={vehicle.status} />
          </div>
          
          {isRented && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'مؤجرة حالياً' : 'Currently Rented'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`w-full mt-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                  onClick={() => navigate(`/agreements?vehicle_id=${vehicle.id}`)}
                >
                  <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'عرض الاتفاقيات' : 'View Agreements'}
                </Button>
              </div>
            </>
          )}
          
          {!isRented && isAvailable && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'هذه المركبة متاحة للإيجار.' : 'This vehicle is available for rent.'}
                </p>
                <Button 
                  size="sm" 
                  className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                  onClick={() => navigate(`/agreements/new?vehicle_id=${vehicle.id}`)}
                >
                  <Plus className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'إنشاء اتفاقية جديدة' : 'Create New Agreement'}
                </Button>
              </div>
            </>
          )}
          
          {isInMaintenance && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'هذه المركبة قيد الصيانة حالياً.' : 'This vehicle is currently under maintenance.'}
                </p>
                <Button 
                  size="sm" 
                  className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                  onClick={() => navigate(`/maintenance/add?vehicle_id=${vehicle.id}`)}
                >
                  <Wrench className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'إضافة سجل صيانة' : 'Add Maintenance Record'}
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
