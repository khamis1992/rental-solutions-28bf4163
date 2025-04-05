
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { lazyLoad } from '@/utils/lazy-loading';

// Import tab content components lazily using our utility
const VehicleOverview = lazyLoad(() => import('./tabs/VehicleOverview'));
const RentalHistory = lazyLoad(() => import('./tabs/RentalHistory'));
const MaintenanceTab = lazyLoad(() => import('./tabs/MaintenanceTab'));

interface VehicleDetailTabsProps {
  vehicle: any;
  onDelete?: (id: string) => void;
}

export function VehicleDetailTabs({ vehicle, onDelete }: VehicleDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="px-1">
      <TabsList className="grid grid-cols-3 mb-4 mx-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="history">Rental History</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="p-0">
        <VehicleOverview vehicle={vehicle} />
      </TabsContent>
      
      <TabsContent value="history" className="p-0">
        <RentalHistory vehicle={vehicle} />
      </TabsContent>
      
      <TabsContent value="maintenance" className="p-0">
        <MaintenanceTab vehicle={vehicle} />
      </TabsContent>
    </Tabs>
  );
}

export default VehicleDetailTabs;
