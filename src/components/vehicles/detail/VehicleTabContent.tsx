import React from 'react';
import { FileText, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgreementHistoryTab } from './AgreementHistoryTab';
import { MaintenanceHistoryTab } from './MaintenanceHistoryTab';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleTabContentProps {
  vehicleId?: string;
}

export const VehicleTabContent: React.FC<VehicleTabContentProps> = ({ vehicleId }) => {
  const { language } = useLanguage();

  return (
    <Tabs defaultValue="agreements" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <TabsList className={language === 'ar' ? 'flex-row-reverse' : ''}>
        <TabsTrigger value="agreements" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'الاتفاقيات' : 'Agreements'}
        </TabsTrigger>
        <TabsTrigger value="maintenance" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Wrench className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'تاريخ الصيانة' : 'Maintenance History'}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="agreements" className="space-y-4">
        <AgreementHistoryTab vehicleId={vehicleId} />
      </TabsContent>
      
      <TabsContent value="maintenance" className="space-y-4">
        <MaintenanceHistoryTab vehicleId={vehicleId} />
      </TabsContent>
    </Tabs>
  );
};
