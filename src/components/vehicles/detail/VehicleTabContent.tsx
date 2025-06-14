
import React from 'react';
import { FileText, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgreementHistoryTab } from './AgreementHistoryTab';
import { MaintenanceHistoryTab } from './MaintenanceHistoryTab';

interface VehicleTabContentProps {
  vehicleId?: string;
}

export const VehicleTabContent: React.FC<VehicleTabContentProps> = ({ vehicleId }) => {
  return (
    <Tabs defaultValue="agreements" className="w-full">
      <TabsList>
        <TabsTrigger value="agreements" className="flex items-center">
          <FileText className="mr-2 h-4 w-4" />
          Agreements
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="flex items-center">
          <Wrench className="mr-2 h-4 w-4" />
          Maintenance History
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
