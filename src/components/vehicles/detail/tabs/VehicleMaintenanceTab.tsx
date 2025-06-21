
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VehicleData } from '@/types/vehicle.types';
import { VehicleMaintenanceOverview } from '../VehicleMaintenanceOverview';
import { VehiclePreventiveMaintenanceWidget } from '../VehiclePreventiveMaintenanceWidget';
import { MaintenanceHistoryTab } from '../MaintenanceHistoryTab';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface VehicleMaintenanceTabProps {
  vehicle: VehicleData;
}

export const VehicleMaintenanceTab: React.FC<VehicleMaintenanceTabProps> = ({ vehicle }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleScheduleMaintenance = () => {
    navigate('/maintenance', { state: { selectedVehicleId: vehicle.id } });
    toast.info(language === 'ar' ? 'تم الانتقال لصفحة جدولة الصيانة' : 'Navigating to maintenance scheduling');
  };

  const handleGenerateMaintenanceReport = () => {
    navigate('/reports', { state: { vehicleId: vehicle.id, reportType: 'maintenance' } });
    toast.info(language === 'ar' ? 'تم الانتقال لصفحة التقارير' : 'Navigating to reports');
  };

  const handleScheduleService = (ruleId: string) => {
    navigate('/maintenance', { state: { selectedVehicleId: vehicle.id, serviceType: ruleId } });
    toast.info(language === 'ar' ? 'تم الانتقال لجدولة الصيانة الوقائية' : 'Navigating to preventive maintenance scheduling');
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Maintenance Overview */}
      <VehicleMaintenanceOverview
        vehicle={vehicle}
        onScheduleMaintenance={handleScheduleMaintenance}
        onViewHistory={() => {}} // This will be handled by the tab itself
        onGenerateReport={handleGenerateMaintenanceReport}
      />

      {/* Preventive Maintenance */}
      <VehiclePreventiveMaintenanceWidget
        vehicle={vehicle}
        onScheduleService={handleScheduleService}
      />

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            <Wrench className="h-5 w-5" />
            {language === 'ar' ? 'سجل الصيانة' : 'Maintenance History'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'سجل جميع أعمال الصيانة التي تمت على هذه المركبة' : 'Record of all maintenance work performed on this vehicle'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceHistoryTab vehicleId={vehicle.id} />
        </CardContent>
      </Card>
    </div>
  );
};
