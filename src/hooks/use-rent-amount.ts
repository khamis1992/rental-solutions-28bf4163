
import { useState, useEffect, useCallback } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/lib/supabase';
import { differenceInMonths } from 'date-fns';

export const useRentAmount = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [rentAmount, setRentAmount] = useState<number | null>(null);
  const [contractAmount, setContractAmount] = useState<number | null>(null);

  // Function to fetch rent amount - memoize to prevent recreation on each render
  const fetchRentAmount = useCallback(async (agreementId: string) => {
    try {
      const { data, error } = await supabase
        .from("leases")
        .select("rent_amount")
        .eq("id", agreementId)
        .single();
      
      if (error) {
        console.error("Error fetching rent amount:", error);
        return null;
      }
      
      if (data && data.rent_amount) {
        console.log("Fetched rent amount:", data.rent_amount);
        return data.rent_amount;
      }
      return null;
    } catch (error) {
      console.error("Error in fetchRentAmount:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadRentAmount = async () => {
      if (!agreementId) return;
      
      // Get the rent_amount directly from the leases table
      const leaseRentAmount = await fetchRentAmount(agreementId);
      
      if (leaseRentAmount && isActive) {
        // Set the rent amount state
        setRentAmount(leaseRentAmount);
        
        // Calculate contract amount if we have agreement dates
        if (agreement?.start_date && agreement?.end_date) {
          const durationMonths = differenceInMonths(
            new Date(agreement.end_date), 
            new Date(agreement.start_date)
          );
          const calculatedContractAmount = leaseRentAmount * (durationMonths > 0 ? durationMonths : 1);
          setContractAmount(calculatedContractAmount);
          console.log(`Contract duration: ${durationMonths} months, Contract amount: ${calculatedContractAmount}`);
        }
      }
    };
    
    loadRentAmount();
    
    return () => {
      isActive = false;
    };
  }, [agreementId, agreement?.start_date, agreement?.end_date, fetchRentAmount]);

  return { rentAmount, contractAmount };
};
