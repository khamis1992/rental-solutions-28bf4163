
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { hasData } from '@/utils/database-type-helpers';

interface TrafficFine {
  id: string;
  violation_number: string;
  violation_date: string;
  fine_amount: number;
  violation_points?: number;
  violation_charge?: string;
  fine_location?: string;
  license_plate?: string;
  payment_status?: string;
  payment_date?: string;
  validation_status?: string;
  validation_date?: string;
  validation_result?: any;
  vehicle_id?: string;
  lease_id?: string;
  assignment_status?: string;
}

export const useTrafficFines = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all traffic fines
  const { data: trafficFines = [], isLoading, error } = useQuery({
    queryKey: ['traffic-fines'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('traffic_fines')
          .select('*')
          .order('violation_date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        return data as TrafficFine[];
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
        throw error;
      }
    }
  });
  
  // Get fines with full details
  const getTrafficFinesWithDetails = async () => {
    try {
      const { data: fines, error } = await supabase
        .from('traffic_fines')
        .select('*')
        .order('validation_status', { ascending: true })
        .order('violation_date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Get lease information for all fines that have a lease_id
      const leaseIds = fines
        .filter(fine => hasData({ data: fine, error: null }) && fine.lease_id)
        .map(fine => fine.lease_id)
        .filter(Boolean);
      
      if (leaseIds.length > 0) {
        // Use in to filter by multiple IDs
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select(`
            id,
            customer_id,
            profiles:customer_id (
              full_name,
              email,
              phone_number,
              nationality
            )
          `)
          .in('id', leaseIds as any);
        
        if (leasesError) {
          console.error('Error fetching leases for traffic fines:', leasesError);
        } else if (hasData({ data: leases, error: null })) {
          // Create a lookup map for lease information
          const leaseMap = {};
          leases.forEach(lease => {
            if (lease && lease.id) {
              leaseMap[lease.id] = {
                id: lease.id,
                customerId: lease.customer_id,
                customerName: lease.profiles && lease.profiles[0] ? lease.profiles[0].full_name : 'Unknown',
                customerPhone: lease.profiles && lease.profiles[0] ? lease.profiles[0].phone_number : 'Unknown'
              };
            }
          });
          
          // Enrich traffic fines with lease information
          return fines.map(fine => {
            if (fine && fine.id) {
              const fineData = {
                id: fine.id,
                violationNumber: fine.violation_number,
                licensePlate: fine.license_plate,
                violationDate: fine.violation_date,
                fineAmount: fine.fine_amount,
                violationCharge: fine.violation_charge,
                validationStatus: fine.validation_status,
                paymentStatus: fine.payment_status,
                leaseId: fine.lease_id,
                vehicleId: fine.vehicle_id,
                location: fine.fine_location
              };
              
              // Add lease information if available
              if (fine.lease_id && leaseMap[fine.lease_id]) {
                return {
                  ...fineData,
                  customerName: leaseMap[fine.lease_id].customerName,
                  customerPhone: leaseMap[fine.lease_id].customerPhone,
                  customerId: leaseMap[fine.lease_id].customerId
                };
              }
              
              return fineData;
            }
            return null;
          }).filter(Boolean);
        }
      }
      
      // Return basic fine information if no leases are associated
      return fines.map(fine => ({
        id: fine.id,
        violationNumber: fine.violation_number,
        licensePlate: fine.license_plate,
        violationDate: fine.violation_date,
        fineAmount: fine.fine_amount,
        violationCharge: fine.violation_charge,
        validationStatus: fine.validation_status,
        paymentStatus: fine.payment_status,
        leaseId: fine.lease_id,
        vehicleId: fine.vehicle_id,
        location: fine.fine_location
      }));
    } catch (error) {
      console.error('Error in getTrafficFinesWithDetails:', error);
      return [];
    }
  };
  
  // Add a new traffic fine
  const addTrafficFine = useMutation({
    mutationFn: async (fineData: Omit<TrafficFine, 'id'>) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .insert({
          ...fineData,
          validation_status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic-fines'] });
      toast({
        title: 'Traffic Fine Added',
        description: 'The fine has been successfully added.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add traffic fine: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  return {
    trafficFines,
    isLoading,
    error,
    getTrafficFinesWithDetails,
    addTrafficFine
  };
};
