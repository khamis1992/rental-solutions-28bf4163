
import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { AlertTriangle } from 'lucide-react';
import TrafficFinesList from '@/components/traffic-fines/TrafficFinesList';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { toast } from 'sonner';

const TrafficFines = () => {
  const { trafficFines, isLoading, assignToCustomer } = useTrafficFines();
  const [initialAssignmentDone, setInitialAssignmentDone] = useState(false);
  
  // Auto-assign unassigned fines when the page loads
  useEffect(() => {
    if (!isLoading && !initialAssignmentDone && trafficFines && trafficFines.length > 0) {
      const unassignedFines = trafficFines.filter(fine => !fine.customerId);
      
      if (unassignedFines.length > 0) {
        toast.info(`Auto-assigning ${unassignedFines.length} unassigned traffic fines...`);
        
        // Process fines one by one to avoid overwhelming the API
        let assignedCount = 0;
        
        const assignFines = async () => {
          for (const fine of unassignedFines) {
            try {
              // Only process fines with license plates
              if (!fine.licensePlate) continue;
              
              await assignToCustomer({ id: fine.id });
              assignedCount++;
            } catch (error) {
              console.error(`Failed to assign fine ${fine.id}:`, error);
            }
          }
          
          if (assignedCount > 0) {
            toast.success(`Successfully assigned ${assignedCount} traffic fines to customers`);
          } else if (unassignedFines.length > 0) {
            toast.warning('No traffic fines could be automatically assigned');
          }
        };
        
        assignFines();
      }
      
      setInitialAssignmentDone(true);
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
      
      <div className="space-y-6">
        <TrafficFinesList />
      </div>
    </PageContainer>
  );
};

export default TrafficFines;
