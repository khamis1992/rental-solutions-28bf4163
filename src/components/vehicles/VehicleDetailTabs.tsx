
import React, { lazy, Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Import tab content components lazily
const VehicleOverview = lazy(() => import('./tabs/VehicleOverview'));
const RentalHistory = lazy(() => import('./tabs/RentalHistory'));
const MaintenanceTab = lazy(() => import('./tabs/MaintenanceTab'));

interface VehicleDetailTabsProps {
  vehicle: any;
  onDelete?: (id: string) => void;
}

export function VehicleDetailTabs({ vehicle, onDelete }: VehicleDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Loading fallback for tab content
  const TabFallback = () => (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-12 w-2/3" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="px-1">
      <TabsList className="grid grid-cols-3 mb-4 mx-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="history">Rental History</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="p-0">
        <Suspense fallback={<TabFallback />}>
          <VehicleOverview vehicle={vehicle} />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="history" className="p-0">
        <Suspense fallback={<TabFallback />}>
          <RentalHistory vehicle={vehicle} />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="maintenance" className="p-0">
        <Suspense fallback={<TabFallback />}>
          <MaintenanceTab vehicle={vehicle} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

export default VehicleDetailTabs;
