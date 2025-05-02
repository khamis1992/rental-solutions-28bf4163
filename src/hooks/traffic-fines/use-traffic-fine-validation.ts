import { useTrafficFinesQuery } from './use-traffic-fines-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Validates that a fine's violation date falls within the lease period
 * and handles edge cases like timezone differences
 */
export function validateFineDate(
  violationDate: Date | string | null | undefined,
  leaseStartDate: Date | string | null | undefined,
  leaseEndDate: Date | string | null | undefined
): { isValid: boolean; reason?: string } {
  // Return invalid if required dates are missing
  if (!violationDate) {
    return { isValid: false, reason: 'Missing violation date' };
  }
  
  if (!leaseStartDate) {
    return { isValid: false, reason: 'Missing lease start date' };
  }
  
  // Convert all dates to UTC midnight to avoid timezone issues
  const normalizeDate = (date: Date | string): Date => {
    const dateObj = new Date(date);
    return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 0, 0, 0, 0));
  };
  
  const normalizedViolationDate = normalizeDate(violationDate);
  const normalizedLeaseStartDate = normalizeDate(leaseStartDate);
  
  // For lease end date, if not provided, use current date
  const normalizedLeaseEndDate = leaseEndDate
    ? normalizeDate(leaseEndDate)
    : normalizeDate(new Date());
  
  // Add a one-day buffer for potential timezone issues (conservative approach)
  const violationBeforeStart = normalizedViolationDate < new Date(normalizedLeaseStartDate.getTime() - 24 * 60 * 60 * 1000);
  const violationAfterEnd = normalizedViolationDate > new Date(normalizedLeaseEndDate.getTime() + 24 * 60 * 60 * 1000);
  
  if (violationBeforeStart) {
    return { 
      isValid: false, 
      reason: `Violation date ${normalizedViolationDate.toISOString().slice(0, 10)} is before lease start date ${normalizedLeaseStartDate.toISOString().slice(0, 10)}`
    };
  }
  
  if (violationAfterEnd) {
    return { 
      isValid: false, 
      reason: `Violation date ${normalizedViolationDate.toISOString().slice(0, 10)} is after lease end date ${normalizedLeaseEndDate.toISOString().slice(0, 10)}`
    };
  }
  
  return { isValid: true };
}

/**
 * Find the best matching lease for a fine based on license plate and date
 */
export async function findBestMatchingLease(
  licensePlate: string, 
  violationDate: Date | string
): Promise<{ leaseId: string | null; reason?: string }> {
  try {
    if (!licensePlate || !violationDate) {
      return { leaseId: null, reason: 'Missing license plate or violation date' };
    }

    const normalizedViolationDate = new Date(violationDate);
    
    // Find vehicles with this license plate
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('license_plate', licensePlate.trim())
      .order('created_at', { ascending: false });
      
    if (vehicleError || !vehicles || vehicles.length === 0) {
      return { leaseId: null, reason: 'No matching vehicle found' };
    }

    const vehicleIds = vehicles.map(v => v.id);
    
    // Find leases for these vehicles that cover the violation date
    const { data: leases, error: leaseError } = await supabase
      .from('leases')
      .select('id, start_date, end_date, vehicle_id, customer_id')
      .in('vehicle_id', vehicleIds)
      .order('start_date', { ascending: false });
      
    if (leaseError || !leases || leases.length === 0) {
      return { leaseId: null, reason: 'No matching lease found' };
    }

    // Find the best matching lease - priority to active leases that cover the violation date
    const matchingLeases = leases.filter(lease => {
      const validation = validateFineDate(
        normalizedViolationDate, 
        lease.start_date, 
        lease.end_date
      );
      return validation.isValid;
    });

    if (matchingLeases.length === 0) {
      return { leaseId: null, reason: 'No lease covers the violation date' };
    }
    
    // Return the most recent matching lease
    return { leaseId: matchingLeases[0].id };
  } catch (error) {
    console.error('Error finding matching lease:', error);
    return { leaseId: null, reason: 'Error during lease matching' };
  }
}

// Other validation functions can be exported from this file
// This is a utility file specifically for traffic fine validation logic
