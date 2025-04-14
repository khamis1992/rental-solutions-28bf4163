
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { MaintenanceList } from '@/components/maintenance/MaintenanceList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VehicleGrid from '@/components/vehicles/VehicleGrid';

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState<string>("records");

  return (
    <PageContainer 
      title="Vehicle Maintenance" 
      description="Track maintenance records and schedule service for your vehicles"
      systemDate={new Date()} // Explicitly passing current date
    >
      <Tabs 
        defaultValue="records" 
        className="w-full mb-6" 
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="records">Maintenance Records</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles Requiring Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="records">
          <MaintenanceList />
        </TabsContent>
        
        <TabsContent value="vehicles">
          <VehiclesNeedingMaintenance />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

// Component to display vehicles that need maintenance
const VehiclesNeedingMaintenance = () => {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Displaying vehicles currently in maintenance or accident status that may require attention.
            </p>
          </div>
        </div>
      </div>
      
      <VehicleGrid 
        filter={{ 
          status: 'maintenance,accident' 
        }} 
        showAdd={false}
      />
    </div>
  );
};

export default Maintenance;
