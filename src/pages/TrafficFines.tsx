
import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { AlertTriangle, Activity } from 'lucide-react';
import TrafficFinesList from '@/components/traffic-fines/TrafficFinesList';
import TrafficFinesMonitoring from '@/components/traffic-fines/TrafficFinesMonitoring';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { toast } from 'sonner';
import { monitorTrafficFineAssignment } from '@/utils/monitoring-utils';
import { supabase } from '@/integrations/supabase/client';

const TrafficFines = () => {
  const { trafficFines, isLoading, assignToCustomer } = useTrafficFines();
  const [initialAssignmentDone, setInitialAssignmentDone] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState('fines');
  
  // Auto-assign unassigned fines when the page loads
  useEffect(() => {
    // Only run auto-assignment if we have traffic fines data, haven't run it yet, and aren't currently loading
    if (!isLoading && !initialAssignmentDone && trafficFines && trafficFines.length > 0) {
      const unassignedFines = trafficFines.filter(fine => !fine.customerId && !fine.leaseId);
      
      if (unassignedFines.length > 0) {
        const assignFines = async () => {
          setIsAssigning(true);
          toast.info(`Auto-assigning ${unassignedFines.length} unassigned traffic fines...`);
          
          // Process fines one by one to avoid overwhelming the API
          let assignedCount = 0;
          let failedCount = 0;
          
          for (const fine of unassignedFines) {
            try {
              // Only process fines with license plates
              if (!fine.licensePlate) {
                console.log(`Skipping fine ${fine.id} - missing license plate`);
                continue;
              }
              
              console.log(`Attempting to assign fine ${fine.id} with license plate ${fine.licensePlate}`);
              await assignToCustomer({ id: fine.id });
              
              // Monitor successful assignment
              monitorTrafficFineAssignment({
                success: true,
                fineId: fine.id,
                message: 'Fine assigned successfully',
                data: { licensePlate: fine.licensePlate }
              }, supabase);
              
              assignedCount++;
            } catch (error) {
              console.error(`Failed to assign fine ${fine.id}:`, error);
              
              // Monitor failed assignment
              monitorTrafficFineAssignment({
                success: false,
                fineId: fine.id,
                message: error instanceof Error ? error.message : 'Unknown error',
                data: { licensePlate: fine.licensePlate }
              }, supabase);
              
              failedCount++;
            }
          }
          
          if (assignedCount > 0) {
            toast.success(`Successfully assigned ${assignedCount} traffic fines to customers`);
          } else if (unassignedFines.length > 0) {
            toast.warning('No traffic fines could be automatically assigned');
          }
          
          if (failedCount > 0) {
            toast.error(`Failed to assign ${failedCount} traffic fines`);
          }
          
          setInitialAssignmentDone(true);
          setIsAssigning(false);
        };
        
        assignFines();
      } else {
        setInitialAssignmentDone(true);
      }
    }
  }, [isLoading, trafficFines, initialAssignmentDone, assignToCustomer]);

  return (
    <PageContainer
      title="Traffic Fines Management"
      description="Manage and track traffic fines for your fleet"
    >
      <SectionHeader
        title="Traffic Fines"
        description="View, pay, and dispute traffic fines for vehicles in your fleet"
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fines">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Traffic Fines
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="mr-2 h-4 w-4" />
            System Monitoring
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fines" className="space-y-6">
          <TrafficFinesList isAutoAssigning={isAssigning} />
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-6">
          <TrafficFinesMonitoring />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default TrafficFines;
