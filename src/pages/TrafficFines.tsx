
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import TrafficFinesList from '@/components/traffic-fines/TrafficFinesList';
import AddTrafficFine from '@/components/traffic-fines/AddTrafficFine'; 
import { Badge } from '@/components/ui/badge';
import { Car, Plus, AlertTriangle } from 'lucide-react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';

const TrafficFines: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('list');
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const { trafficFines } = useTrafficFines();
  
  const unassignedCount = trafficFines.filter(fine => !fine.lease_id).length;
  
  return (
    <PageContainer title="Traffic Fines Management">
      <SectionHeader
        title="Traffic Fines" 
        description="Manage and track traffic fines for your fleet vehicles"
        icon={AlertTriangle}
        actions={
          <Badge variant="outline" className="mr-2 font-normal">
            {unassignedCount} unassigned fine{unassignedCount !== 1 ? 's' : ''}
          </Badge>
        }
      />
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="list">View All</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="list">
          <TrafficFinesList isAutoAssigning={isAutoAssigning} />
        </TabsContent>
        
        <TabsContent value="add">
          <AddTrafficFine onSuccess={() => setCurrentTab('list')} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default TrafficFines;
