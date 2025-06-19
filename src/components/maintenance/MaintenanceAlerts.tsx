import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MaintenanceAlertsProps {
  activeTasksCount: number;
  vehiclesInMaintenanceCount: number;
  vehiclesNeedingPreventiveMaintenance: number;
  onViewActiveDetails: () => void;
  onSchedulePreventive: () => void;
}

export const MaintenanceAlerts: React.FC<MaintenanceAlertsProps> = ({
  activeTasksCount,
  vehiclesInMaintenanceCount,
  vehiclesNeedingPreventiveMaintenance,
  onViewActiveDetails,
  onSchedulePreventive
}) => {
  const { language } = useLanguage();

  // Show alert if we have more than 3 active tasks or more than 2 vehicles in maintenance
  const showWorkloadAlert = activeTasksCount > 3 || vehiclesInMaintenanceCount > 2;
  
  // Show preventive maintenance alert if any vehicles need it
  const showPreventiveAlert = vehiclesNeedingPreventiveMaintenance > 0;

  if (!showWorkloadAlert && !showPreventiveAlert) {
    return null;
  }

  return (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* تنبيه زيادة أعمال الصيانة */}
      {showWorkloadAlert && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <AlertTriangle className="h-6 w-6 text-orange-500 flex-shrink-0" />
              <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <h4 className="font-medium text-orange-800">
                  {language === 'ar' ? 'تنبيه: زيادة في أعمال الصيانة' : 'Alert: High Maintenance Workload'}
                </h4>
                <p className="text-sm text-orange-600">
                  {language === 'ar' 
                    ? `لديك ${activeTasksCount} مهمة صيانة نشطة و ${vehiclesInMaintenanceCount} مركبة في الصيانة`
                    : `You have ${activeTasksCount} active maintenance tasks and ${vehiclesInMaintenanceCount} vehicles in maintenance`
                  }
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onViewActiveDetails}
                className={`flex-shrink-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* تنبيه الصيانة الوقائية */}
      {showPreventiveAlert && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Clock className="h-6 w-6 text-blue-500 flex-shrink-0" />
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                  <h4 className="font-medium text-blue-800">
                    {language === 'ar' ? 'صيانة وقائية مطلوبة' : 'Preventive Maintenance Required'}
                  </h4>
                  <p className="text-sm text-blue-600">
                    {language === 'ar' 
                      ? `${vehiclesNeedingPreventiveMaintenance} مركبات تحتاج صيانة وقائية`
                      : `${vehiclesNeedingPreventiveMaintenance} vehicles need preventive maintenance`
                    }
                  </p>
                </div>
              </div>
              <Button 
                size="sm"
                onClick={onSchedulePreventive}
                className={`flex-shrink-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                {language === 'ar' ? 'جدولة الآن' : 'Schedule Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 