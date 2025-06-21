
import React from 'react';
import { FileText, Wrench, BarChart3, Car, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleOverviewTab } from './tabs/VehicleOverviewTab';
import { VehicleMaintenanceTab } from './tabs/VehicleMaintenanceTab';
import { VehicleRentalTab } from './tabs/VehicleRentalTab';
import { VehicleDocumentsTab } from './tabs/VehicleDocumentsTab';
import { VehicleSettingsTab } from './tabs/VehicleSettingsTab';
import { useLanguage } from '@/contexts/LanguageContext';
import { VehicleData } from '@/types/vehicle.types';

interface VehicleTabContentProps {
  vehicleId?: string;
  vehicle?: VehicleData;
  onMarkForMaintenance?: () => void;
  onMarkAsAvailable?: () => void;
}

export const VehicleTabContent: React.FC<VehicleTabContentProps> = ({ 
  vehicleId, 
  vehicle,
  onMarkForMaintenance = () => {},
  onMarkAsAvailable = () => {}
}) => {
  const { language } = useLanguage();

  if (!vehicle) {
    return (
      <div className={`text-center py-8 ${language === 'ar' ? 'text-right' : ''}`}>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'لا توجد بيانات للمركبة' : 'No vehicle data available'}
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <TabsList className={`grid w-full grid-cols-5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <TabsTrigger value="overview" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <BarChart3 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          <span className="hidden sm:inline">{language === 'ar' ? 'نظرة عامة' : 'Overview'}</span>
        </TabsTrigger>
        <TabsTrigger value="rental" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Car className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          <span className="hidden sm:inline">{language === 'ar' ? 'الإيجار' : 'Rental'}</span>
        </TabsTrigger>
        <TabsTrigger value="maintenance" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Wrench className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          <span className="hidden sm:inline">{language === 'ar' ? 'الصيانة' : 'Maintenance'}</span>
        </TabsTrigger>
        <TabsTrigger value="documents" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          <span className="hidden sm:inline">{language === 'ar' ? 'المستندات' : 'Documents'}</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Settings className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          <span className="hidden sm:inline">{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4 mt-6">
        <VehicleOverviewTab 
          vehicle={vehicle}
          onMarkForMaintenance={onMarkForMaintenance}
          onMarkAsAvailable={onMarkAsAvailable}
        />
      </TabsContent>
      
      <TabsContent value="rental" className="space-y-4 mt-6">
        <VehicleRentalTab vehicle={vehicle} />
      </TabsContent>
      
      <TabsContent value="maintenance" className="space-y-4 mt-6">
        <VehicleMaintenanceTab vehicle={vehicle} />
      </TabsContent>
      
      <TabsContent value="documents" className="space-y-4 mt-6">
        <VehicleDocumentsTab vehicle={vehicle} />
      </TabsContent>
      
      <TabsContent value="settings" className="space-y-4 mt-6">
        <VehicleSettingsTab vehicle={vehicle} />
      </TabsContent>
    </Tabs>
  );
};
