
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { useQuery } from '@tanstack/react-query';
import { asTypedDatabaseId } from '@/utils/database-type-helpers';

type LeaseRateQueryResult = {
  rent_amount?: number | null;
};

/**
 * Hook to get the correct rent amount for an agreement
 */
export function useRentAmount(agreement?: Agreement | null, agreementId?: string) {
  const [rentAmount, setRentAmount] = useState<number | undefined>(
    agreement?.rent_amount || agreement?.total_amount || 0
  );

  // Query to fetch the rent amount for the current agreement
  const { data: leaseRateData } = useQuery({
    queryKey: ['lease-rate', agreement?.id || agreementId],
    queryFn: async () => {
      if (!agreement?.id && !agreementId) return null;
      
      try {
        // Use the ID from agreement object if available, otherwise use the agreementId prop
        const id = agreement?.id || agreementId;
        if (!id) return null;
        
        // Fetch lease data to get the rent_amount
        const { data, error } = await supabase
          .from('leases')
          .select('rent_amount')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching lease rate:', error);
          return null;
        }
        
        return data as LeaseRateQueryResult;
      } catch (error) {
        console.error('Error in lease rate query:', error);
        return null;
      }
    },
    enabled: Boolean(agreement?.id || agreementId)
  });

  // Query to fetch the default rate for the vehicle type if no rent_amount is set
  const { data: vehicleRateData } = useQuery({
    queryKey: ['vehicle-rate', agreement?.vehicle_id],
    queryFn: async () => {
      if (!agreement?.vehicle_id) return null;
      
      try {
        // Fetch vehicle default rate
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            rent_amount,
            vehicle_type_id,
            vehicle_types:vehicle_type_id (
              monthly_rate
            )
          `)
          .eq('id', agreement.vehicle_id)
          .single();
        
        if (error) {
          console.error('Error fetching vehicle rate:', error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Error in vehicle rate query:', error);
        return null;
      }
    },
    enabled: Boolean(agreement?.vehicle_id) && !Boolean(leaseRateData?.rent_amount)
  });

  // Update rent amount when data is available
  useEffect(() => {
    // First priority: Use the rent_amount from the agreement object if it exists
    if (agreement?.rent_amount) {
      setRentAmount(agreement.rent_amount);
      return;
    }

    // Second priority: Use the rent_amount from the lease query
    if (leaseRateData?.rent_amount) {
      setRentAmount(leaseRateData.rent_amount);
      return;
    }

    // Third priority: Use the vehicle's rent_amount if it exists
    if (vehicleRateData?.rent_amount) {
      setRentAmount(vehicleRateData.rent_amount);
      return;
    }

    // Fourth priority: Use the vehicle type's monthly_rate if it exists
    if (vehicleRateData?.vehicle_types?.monthly_rate) {
      setRentAmount(vehicleRateData.vehicle_types.monthly_rate);
      return;
    }

    // Fallback to the total amount if nothing else is available
    if (agreement?.total_amount) {
      setRentAmount(agreement.total_amount);
    }
  }, [agreement, leaseRateData, vehicleRateData]);

  return { rentAmount };
}
