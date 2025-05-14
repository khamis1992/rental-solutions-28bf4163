
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/supabase-type-helpers';

export interface TrafficFine {
  id: string;
  violation_number: string;
  license_plate: string;
  violation_date: string;
  fine_amount: number;
  violation_charge: string;
  payment_status: string;
  fine_location: string;
  vehicle_id?: string | null;
  lease_id?: string | null;
  payment_date?: string | null;
  assignment_status?: string | null;
}

export interface TrafficFineCustomer {
  id: string;
  lease_id: string;
  customer_id: string;
  customer_name?: string;
  start_date: string;
  end_date: string;
}

export function useTrafficFines(agreementId?: string) {
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

  const markFineAsPaid = useCallback(async (fineId: string, paymentDate: string) => {
    try {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ 
          payment_status: 'paid',
          payment_date: paymentDate
        })
        .eq('id', fineId);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setFines(prevFines => 
        prevFines.map(fine => 
          fine.id === fineId 
            ? { ...fine, payment_status: 'paid', payment_date: paymentDate } 
            : fine
        )
      );
      
      return true;
    } catch (err) {
      console.error("Error marking fine as paid:", err);
      return false;
    }
  }, []);

  const addNewFine = useCallback(async (fineData: Omit<TrafficFine, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('traffic_fines')
        .insert([fineData])
        .select();
      
      if (error) throw new Error(error.message);
      
      if (data && data.length > 0) {
        setFines(prevFines => [...prevFines, data[0] as TrafficFine]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error adding new traffic fine:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  return {
    fines,
    customerData,
    isLoading,
    error,
    fetchFines,
    markFineAsPaid,
    addNewFine
  };
}
