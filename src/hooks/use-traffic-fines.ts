
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/supabase-type-helpers';
import { useMutation, useQuery } from '@tanstack/react-query';

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

export type TrafficFineCreatePayload = Omit<TrafficFine, 'id'>;

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

  // Add mark fine as paid function
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

  // Add new fine function
  const addNewFine = useCallback(async (fineData: TrafficFineCreatePayload) => {
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

  // Add pay traffic fine mutation
  const payTrafficFine = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'paid', payment_date: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setFines(prevFines =>
        prevFines.map(fine =>
          fine.id === id
            ? { ...fine, payment_status: 'paid', payment_date: new Date().toISOString() }
            : fine
        )
      );
      return { success: true, id };
    }
  });

  // Add dispute traffic fine mutation
  const disputeTrafficFine = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'disputed' })
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setFines(prevFines =>
        prevFines.map(fine =>
          fine.id === id ? { ...fine, payment_status: 'disputed' } : fine
        )
      );
      return { success: true, id };
    }
  });

  // Add assign to customer mutation
  const assignToCustomer = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const fine = fines.find(f => f.id === id);
      if (!fine?.license_plate) {
        throw new Error("Missing license plate information");
      }
      
      // Find the most recent lease with this license plate
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select(`
          id, 
          customer_id,
          vehicles(license_plate),
          profiles:customer_id(full_name)
        `)
        .eq('vehicles.license_plate', fine.license_plate)
        .order('start_date', { ascending: false })
        .limit(1);
      
      if (leaseError) throw new Error(leaseError.message);
      if (!leaseData || leaseData.length === 0) {
        throw new Error(`No lease found for license plate ${fine.license_plate}`);
      }
      
      const lease = leaseData[0];
      
      // Update the fine with customer information
      const { error: updateError } = await supabase
        .from('traffic_fines')
        .update({
          lease_id: lease.id,
          customer_id: lease.customer_id,
          assignment_status: 'assigned'
        })
        .eq('id', id);
      
      if (updateError) throw new Error(updateError.message);
      
      // Update local state
      setFines(prevFines =>
        prevFines.map(f =>
          f.id === id ? { 
            ...f, 
            lease_id: lease.id,
            customer_id: lease.customer_id,
            assignment_status: 'assigned',
            customerName: lease.profiles?.full_name
          } : f
        )
      );
      
      return { success: true, id };
    }
  });

  // Add cleanup invalid assignments function
  const cleanupInvalidAssignments = useMutation({
    mutationFn: async () => {
      const invalidAssignedFines = fines.filter(fine => {
        if (!fine.lease_id || !fine.violation_date) return false;
        
        // Get the lease details for this fine
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('start_date, end_date')
          .eq('id', fine.lease_id)
          .single();
        
        if (leaseError || !leaseData) return true; // Consider as invalid if we can't verify
        
        const violationDate = new Date(fine.violation_date);
        const leaseStartDate = new Date(leaseData.start_date);
        const leaseEndDate = new Date(leaseData.end_date);
        
        // If violation date is outside lease period, it's invalid
        return violationDate < leaseStartDate || violationDate > leaseEndDate;
      });
      
      const fineIds = invalidAssignedFines.map(fine => fine.id);
      
      if (fineIds.length === 0) {
        return { success: true, count: 0 };
      }
      
      // Reset customer and lease assignments
      const { error } = await supabase
        .from('traffic_fines')
        .update({
          lease_id: null,
          customer_id: null,
          assignment_status: 'pending'
        })
        .in('id', fineIds);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setFines(prevFines =>
        prevFines.map(fine =>
          fineIds.includes(fine.id) ? {
            ...fine,
            lease_id: null,
            customer_id: null,
            assignment_status: 'pending',
            customerName: undefined
          } : fine
        )
      );
      
      return { success: true, count: fineIds.length };
    }
  });

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  // For compatibility with existing code, exposing both fines and trafficFines
  return {
    fines,
    trafficFines: fines, // For backward compatibility
    customerData,
    isLoading,
    error,
    fetchFines,
    markFineAsPaid,
    addNewFine,
    payTrafficFine,
    disputeTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments,
    createTrafficFine: addNewFine // Alias for backward compatibility
  };
}
