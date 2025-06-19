import React from 'react';
import { FileText, Wrench, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgreementHistoryTab } from './AgreementHistoryTab';
import { MaintenanceHistoryTab } from './MaintenanceHistoryTab';
import { VehicleMaintenanceOverview } from './VehicleMaintenanceOverview';
import { VehiclePreventiveMaintenanceWidget } from './VehiclePreventiveMaintenanceWidget';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface VehicleTabContentProps {
  vehicleId?: string;
  vehicle?: any; // نحتاج بيانات المركبة للمكون الجديد
}

export const VehicleTabContent: React.FC<VehicleTabContentProps> = ({ vehicleId, vehicle }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Handlers للإجراءات في نظرة عامة الصيانة
  const handleScheduleMaintenance = () => {
    navigate('/maintenance', { state: { selectedVehicleId: vehicleId } });
    toast.info(language === 'ar' ? 'تم الانتقال لصفحة جدولة الصيانة' : 'Navigating to maintenance scheduling');
  };

  const handleViewMaintenanceHistory = () => {
    // تفعيل تبويب تاريخ الصيانة
    const maintenanceTab = document.querySelector('[data-value="maintenance"]') as HTMLElement;
    maintenanceTab?.click();
  };

  const handleGenerateMaintenanceReport = () => {
    navigate('/reports', { state: { vehicleId, reportType: 'maintenance' } });
    toast.info(language === 'ar' ? 'تم الانتقال لصفحة التقارير' : 'Navigating to reports');
  };

  const handleScheduleService = (ruleId: string) => {
    navigate('/maintenance', { state: { selectedVehicleId: vehicleId, serviceType: ruleId } });
    toast.info(language === 'ar' ? 'تم الانتقال لجدولة الصيانة الوقائية' : 'Navigating to preventive maintenance scheduling');
  };

  return (
    <Tabs defaultValue="maintenance-overview" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <TabsList className={`grid w-full grid-cols-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <TabsTrigger value="maintenance-overview" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`} data-value="maintenance-overview">
          <BarChart3 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'نظرة عامة على الصيانة' : 'Maintenance Overview'}
        </TabsTrigger>
        <TabsTrigger value="agreements" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`} data-value="agreements">
          <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'الاتفاقيات' : 'Agreements'}
        </TabsTrigger>
        <TabsTrigger value="maintenance" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`} data-value="maintenance">
          <Wrench className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'تاريخ الصيانة' : 'Maintenance History'}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="maintenance-overview" className="space-y-4">
        {vehicle && (
          <>
            <VehicleMaintenanceOverview
              vehicle={vehicle}
              onScheduleMaintenance={handleScheduleMaintenance}
              onViewHistory={handleViewMaintenanceHistory}
              onGenerateReport={handleGenerateMaintenanceReport}
            />
            <VehiclePreventiveMaintenanceWidget
              vehicle={vehicle}
              onScheduleService={handleScheduleService}
            />
          </>
        )}
      </TabsContent>
      
      <TabsContent value="agreements" className="space-y-4">
        <AgreementHistoryTab vehicleId={vehicleId} />
      </TabsContent>
      
      <TabsContent value="maintenance" className="space-y-4">
        <MaintenanceHistoryTab vehicleId={vehicleId} />
      </TabsContent>
    </Tabs>
  );
};
