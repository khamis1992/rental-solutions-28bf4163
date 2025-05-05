
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { MaintenanceList } from '@/components/maintenance/MaintenanceList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import VehicleGrid from '@/components/vehicles/VehicleGrid';

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState('records');
  
  return (
    <PageContainer 
      title="Vehicle Maintenance" 
      description="Track maintenance records and schedule service for your vehicles"
      systemDate={new Date()}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="records" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="records">Maintenance Records</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles In Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="records">
          <MaintenanceList />
        </TabsContent>
        
        <TabsContent value="vehicles">
          <Card className="p-4">
            <VehicleGrid 
              filter={{ 
                statuses: ['maintenance', 'accident']
              }} 
              showAdd={false}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Maintenance;
