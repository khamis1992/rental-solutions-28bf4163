/**
 * Custom hook for managing vehicle reassignment operations in lease agreements.
 * Handles the complex business logic of transferring a vehicle from one agreement to another
 * while maintaining data consistency and business rules.
 */

import { useState, useEffect } from 'react';
import { useVehicle } from '@/hooks/use-vehicle';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { LeaseDetails, VehicleDetails } from '@/types/reassignment.types';
import { asVehicleId, asLeaseId } from '@/types/database-common';

/**
 * Hook for managing the lease reassignment workflow
 * @param leaseId - The ID of the lease being modified
 * @returns Object containing lease details, available vehicles, and reassignment functions
 */
export function useLeaseReassignment(leaseId: string) {
  const [lease, setLease] = useState<LeaseDetails>({
    id: null,
    agreement_number: null,
    status: null,
    customer_id: null,
    vehicle_id: null,
    start_date: null,
    end_date: null,
    customerName: null,
  });
  
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [currentVehicle, setCurrentVehicle] = useState<VehicleDetails>({
    id: null,
    make: null,
    model: null,
    license_plate: null,
  });

  const { vehicles } = useVehicle();

  useEffect(() => {
    fetchLeaseDetails();
    fetchCurrentVehicle();
  }, [leaseId]);

  /**
   * Fetches the complete lease details including customer information
   * Validates the lease exists and is eligible for reassignment
   */
  const fetchLeaseDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id, agreement_number, status, customer_id, vehicle_id, start_date, end_date,
          profiles:customer_id (id, full_name, email, phone_number)
        `)
        .eq('id', asLeaseId(leaseId))
        .single();

      if (error) {
        console.error('Error fetching lease details:', error);
        toast.error('Failed to fetch agreement details');
        return;
      }

      if (data) {
        const leaseData = data as any;
        setLease({
          ...leaseData,
          customerName: leaseData.profiles?.[0]?.full_name || 'Unknown Customer'
        });
      }
    } catch (error) {
      console.error('Error in fetch lease details:', error);
      toast.error('Failed to load agreement data');
    }
  };

  /**
   * Retrieves current vehicle information
   * Ensures the vehicle data is available for comparison and display
   */
  const fetchCurrentVehicle = async () => {
    if (!lease.vehicle_id) return;
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate')
        .eq('id', asVehicleId(lease.vehicle_id))
        .single();

      if (error) {
        console.error('Error fetching current vehicle:', error);
        toast.error('Failed to fetch current vehicle details');
        return;
      }

      if (data) {
        setCurrentVehicle({
          id: asVehicleId(data.id),
          make: data.make,
          model: data.model,
          license_plate: data.license_plate,
        });
      }
    } catch (error) {
      console.error('Error in fetch current vehicle:', error);
      toast.error('Failed to load current vehicle data');
    }
  };

  /**
   * Executes the vehicle reassignment process
   * Handles the database update and ensures data consistency
   * @returns Promise<boolean> indicating success or failure
   */
  const handleConfirmReassignment = async (): Promise<boolean> => {
    if (!selectedVehicleId) return false;
    
    try {
      const updates = {
        vehicle_id: selectedVehicleId,
      };

      const { error: updateError } = await supabase
        .from('leases')
        .update(updates)
        .eq('id', asLeaseId(leaseId));

      if (updateError) {
        console.error('Error updating lease with new vehicle:', updateError);
        toast.error('Failed to update lease with new vehicle');
        return false;
      }

      toast.success('Vehicle reassigned successfully!');
      return true;
    } catch (error) {
      console.error('Error in handleConfirmReassignment:', error);
      toast.error('Failed to reassign vehicle');
      return false;
    }
  };

  return {
    lease,
    currentVehicle,
    selectedVehicleId,
    setSelectedVehicleId,
    handleConfirmReassignment,
    availableVehicles: vehicles?.filter(v => v.id !== currentVehicle.id) || []
  };
}
