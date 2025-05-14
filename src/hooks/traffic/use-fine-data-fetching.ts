
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/supabase-type-helpers';
import { TrafficFine, TrafficFineCustomer } from './types';

export const useFineDataFetching = (agreementId?: string) => {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [customerData, setCustomerData] = useState<TrafficFineCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFines = useCallback(async () => {
    if (!agreementId) {
      setFines([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // First get vehicle ID from agreement to filter traffic fines
      const { data: agreementData, error: agreementError } = await supabase
        .from('leases')
        .select('id, vehicle_id, customer_id, start_date, end_date')
        .eq('id', agreementId)
        .single();
      
      if (agreementError) throw new Error(agreementError.message);
      if (!agreementData) throw new Error('Agreement not found');
      
      // Now get the fines using this vehicle ID
      const { data: finesData, error: finesError } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('vehicle_id', agreementData.vehicle_id)
        .gte('violation_date', agreementData.start_date)
        .lte('violation_date', agreementData.end_date);
      
      if (finesError) throw new Error(finesError.message);
      
      // Process each fine to ensure it has lease_id
      const processedFines = hasData(finesData) ? finesData.map(fine => {
        // Ensure lease_id is assigned if not already
        return {
          ...fine,
          lease_id: fine.lease_id || agreementId
        } as TrafficFine;
      }) : [];
      
      setFines(processedFines);

      // Update fines that don't have lease_id set
      const finesNeedingUpdate = processedFines.filter(fine => !fine.lease_id);
      if (finesNeedingUpdate.length > 0) {
        const fineIds = finesNeedingUpdate.map(fine => fine.id);
        await supabase
          .from('traffic_fines')
          .update({ lease_id: agreementId })
          .in('id', fineIds);
      }
      
      // Get customer info for displaying
      const { data: leaseWithCustomer, error: leaseError } = await supabase
        .from('leases')
        .select(`
          id, 
          customer_id, 
          start_date, 
          end_date,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq('id', agreementId)
        .single();
      
      if (!leaseError && leaseWithCustomer) {
        const customerInfo: TrafficFineCustomer = {
          id: leaseWithCustomer.id,
          lease_id: leaseWithCustomer.id,
          customer_id: leaseWithCustomer.customer_id,
          customer_name: leaseWithCustomer.profiles?.[0]?.full_name || 'Unknown',
          start_date: leaseWithCustomer.start_date,
          end_date: leaseWithCustomer.end_date
        };
        setCustomerData(customerInfo);
      }
      
    } catch (err) {
      console.error("Error fetching traffic fines:", err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching traffic fines'));
    } finally {
      setIsLoading(false);
    }
  }, [agreementId]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  return { fines, setFines, customerData, isLoading, error, fetchFines };
};
