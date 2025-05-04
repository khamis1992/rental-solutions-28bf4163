
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { validationPatterns } from '@/lib/validation';
import { normalizeLicensePlate } from '@/utils/searchUtils';
import { TrafficFinePayload, TrafficFineCreatePayload } from './types';

/**
 * Validates a license plate for traffic fines
 * @param licensePlate The license plate to validate
 * @returns An object with validation result and normalized plate if valid
 */
export function validateLicensePlate(licensePlate: string): {
  isValid: boolean;
  error?: string;
  normalizedPlate?: string;
} {
  // Check if license plate is present and not empty
  if (!licensePlate || licensePlate.trim() === '') {
    return {
      isValid: false,
      error: 'License plate is required for traffic fines'
    };
  }

  // Normalize the license plate
  const normalizedPlate = normalizeLicensePlate(licensePlate);

  // Check minimum length after normalization
  if (normalizedPlate.length < 2) {
    return {
      isValid: false,
      error: 'License plate must be at least 2 characters'
    };
  }

  // Validate format using the pattern
  if (!validationPatterns.licensePlate.test(normalizedPlate)) {
    return {
      isValid: false,
      error: 'Invalid license plate format. Must contain only letters, numbers, and hyphens'
    };
  }

  return {
    isValid: true,
    normalizedPlate
  };
}

/**
 * Hook that provides mutations for traffic fines management
 */
export function useTrafficFineMutations() {
  const queryClient = useQueryClient();

  // Create a new traffic fine
  const createTrafficFine = useMutation({
    mutationFn: async (fineData: TrafficFineCreatePayload) => {
      try {
        // Validate license plate with comprehensive validation
        const licensePlateValidation = validateLicensePlate(fineData.licensePlate);
        if (!licensePlateValidation.isValid) {
          throw new Error(licensePlateValidation.error);
        }

        // Validate violation date is not in the future
        const currentDate = new Date();
        currentDate.setHours(23, 59, 59, 999); // End of today

        if (fineData.violationDate > currentDate) {
          throw new Error('Violation date cannot be in the future');
        }

        // Create payload for database
        const dbPayload = {
          violation_number: fineData.violationNumber,
          license_plate: licensePlateValidation.normalizedPlate, // Use normalized plate
          violation_date: fineData.violationDate,
          fine_amount: fineData.fineAmount,
          violation_charge: fineData.violationCharge,
          fine_location: fineData.location,
          payment_status: fineData.paymentStatus || 'pending',
          assignment_status: 'pending'
        };

        const { data, error } = await supabase
          .from('traffic_fines')
          .insert(dbPayload)
          .select('*')
          .single();

        if (error) {
          throw new Error(`Failed to create traffic fine: ${error.message}`);
        }

        return data;
      } catch (error) {
        console.error('Error creating traffic fine:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    }
  });

  // Assign a traffic fine to a customer
  const assignToCustomer = useMutation({
    mutationFn: async ({ id }: TrafficFinePayload) => {
      try {
        console.log(`Attempting to assign fine ${id} to customer`);

        // First get the traffic fine details to find license plate and violation date
        const { data: fine, error: fineError } = await supabase
          .from('traffic_fines')
          .select('license_plate, violation_date')
          .eq('id', id)
          .single();

        if (fineError || !fine) {
          throw new Error(`Failed to fetch fine details: ${fineError?.message || 'No data found'}`);
        }

        // Validate the license plate from the fine
        const licensePlateValidation = validateLicensePlate(fine.license_plate);
        if (!licensePlateValidation.isValid) {
          throw new Error(`Cannot assign fine: ${licensePlateValidation.error}`);
        }

        const violationDate = new Date(fine.violation_date);
        console.log(`Fine violation date: ${violationDate.toISOString()}`);

        // Find the vehicle with this license plate (using normalized plate)
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id')
          .eq('license_plate', licensePlateValidation.normalizedPlate)
          .single();

        if (vehicleError || !vehicleData) {
          throw new Error(`No vehicle found with license plate ${licensePlateValidation.normalizedPlate}`);
        }

        // Find active lease for this vehicle that covers the violation date
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('id, customer_id, start_date, end_date')
          .eq('vehicle_id', vehicleData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (leaseError) {
          throw new Error(`Error finding leases: ${leaseError.message}`);
        }

        if (!leaseData || leaseData.length === 0) {
          throw new Error(`No active lease found for this vehicle`);
        }

        // Find a lease where violation date falls between start and end date
        let matchingLease = null;
        for (const lease of leaseData) {
          const startDate = new Date(lease.start_date);
          const endDate = lease.end_date ? new Date(lease.end_date) : new Date();

          console.log(`Checking lease ${lease.id}: start=${startDate.toISOString()}, end=${endDate.toISOString()}`);

          if (violationDate >= startDate && violationDate <= endDate) {
            matchingLease = lease;
            break;
          }
        }

        if (!matchingLease) {
          throw new Error(`Traffic fine date (${violationDate.toLocaleDateString()}) is outside any lease period for this vehicle`);
        }

        console.log(`Found matching lease ${matchingLease.id} for the violation date`);

        // Update the fine with the lease ID
        const { error: updateError } = await supabase
          .from('traffic_fines')
          .update({
            lease_id: matchingLease.id,
            assignment_status: 'assigned'
          })
          .eq('id', id);

        if (updateError) {
          throw new Error(`Failed to assign fine: ${updateError.message}`);
        }

        return {
          success: true,
          message: 'Fine assigned to customer successfully',
          leaseId: matchingLease.id,
          customerId: matchingLease.customer_id
        };
      } catch (error) {
        console.error('Error assigning fine to customer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Fine assigned to customer successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign fine', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });

  // Pay a traffic fine
  const payTrafficFine = useMutation({
    mutationFn: async ({ id }: TrafficFinePayload) => {
      const { error } = await supabase
        .from('traffic_fines')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to pay fine: ${error.message}`);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    }
  });

  // Dispute a traffic fine
  const disputeTrafficFine = useMutation({
    mutationFn: async ({ id }: TrafficFinePayload) => {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'disputed' })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to dispute fine: ${error.message}`);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    }
  });

  return {
    createTrafficFine,
    assignToCustomer,
    payTrafficFine,
    disputeTrafficFine
  };
}
