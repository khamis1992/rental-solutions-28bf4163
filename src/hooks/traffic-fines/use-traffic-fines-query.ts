
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { hasData } from '@/utils/supabase-type-helpers';

export type TrafficFineStatusType = 'pending' | 'paid' | 'disputed';

export interface TrafficFine {
  id: string;
  violationNumber: string;
  licensePlate?: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge?: string;
  paymentStatus: TrafficFineStatusType;
  location?: string;
  vehicleId?: string;
  vehicleModel?: string;
  customerId?: string;
  customerName?: string;
  paymentDate?: Date;
  leaseId?: string;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
}

/**
 * Hook to fetch traffic fines with additional customer information
 */
export function useTrafficFinesQuery() {
  return useQuery({
    queryKey: ['trafficFines'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('traffic_fines')
          .select(`
            id,
            violation_number,
            license_plate,
            violation_date,
            fine_amount,
            violation_charge,
            payment_status,
            fine_location,
            vehicle_id,
            lease_id,
            payment_date,
            assignment_status
          `)
          .order('violation_date', { ascending: false });
        
        if (error) {
          console.error('Error fetching traffic fines:', error);
          throw new Error(`Failed to fetch traffic fines: ${error.message}`);
        }

        if (!data) {
          return [];
        }
        
        // Get customer information for assigned fines
        const finesWithLeaseIds = data.filter(fine => fine.lease_id);
        let customerAndLeaseInfo: Record<string, { 
          customer_id: string; 
          customer_name?: string;
          start_date?: string;
          end_date?: string;
        }> = {};
        
        if (finesWithLeaseIds.length > 0) {
          const leaseIds = finesWithLeaseIds.map(fine => fine.lease_id).filter(Boolean);
          const { data: leases, error: leaseError } = await supabase
            .from('leases')
            .select('id, customer_id, start_date, end_date, profiles(full_name)')
            .in('id', leaseIds as string[]);
            
          if (leaseError) {
            console.error('Error fetching lease information:', leaseError);
          } else if (leases) {
            // Create a mapping of lease_id to customer information and lease dates
            leases.forEach(lease => {
              if (lease && lease.id) {
                customerAndLeaseInfo[lease.id] = {
                  customer_id: lease.customer_id,
                  customer_name: lease.profiles?.full_name,
                  start_date: lease.start_date,
                  end_date: lease.end_date
                };
              }
            });
          }
        }
        
        // Transform the data to match our TrafficFine interface
        return data.map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number || `TF-${Math.floor(Math.random() * 10000)}`,
          licensePlate: fine.license_plate,
          violationDate: fine.violation_date ? new Date(fine.violation_date) : new Date(),
          fineAmount: fine.fine_amount || 0,
          violationCharge: fine.violation_charge,
          paymentStatus: (fine.payment_status as TrafficFineStatusType) || 'pending',
          location: fine.fine_location,
          vehicleId: fine.vehicle_id,
          paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined,
          leaseId: fine.lease_id,
          // Add customer information if available
          customerId: fine.lease_id ? customerAndLeaseInfo[fine.lease_id]?.customer_id : undefined,
          customerName: fine.lease_id ? customerAndLeaseInfo[fine.lease_id]?.customer_name : undefined,
          // Add lease dates for validation
          leaseStartDate: fine.lease_id && customerAndLeaseInfo[fine.lease_id]?.start_date ? 
            new Date(customerAndLeaseInfo[fine.lease_id].start_date as string) : undefined,
          leaseEndDate: fine.lease_id && customerAndLeaseInfo[fine.lease_id]?.end_date ?
            new Date(customerAndLeaseInfo[fine.lease_id].end_date as string) : undefined
        }));
      } catch (error) {
        console.error('Error in traffic fines data fetching:', error);
        throw error;
      }
    }
  });
}
