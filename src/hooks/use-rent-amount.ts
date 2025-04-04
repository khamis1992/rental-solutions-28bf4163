
import { useState, useEffect, useCallback, useRef } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { differenceInMonths } from 'date-fns';
import { toast } from 'sonner';

export const useRentAmount = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [rentAmount, setRentAmount] = useState<number | null>(null);
  const [contractAmount, setContractAmount] = useState<number | null>(null);
  const fetchInProgress = useRef(false);
  const hasInitiallyFetched = useRef(false);
  const errorCount = useRef(0);

  // Function to fetch rent amount - memoize to prevent recreation on each render
  const fetchRentAmount = useCallback(async (agreementId: string) => {
    if (fetchInProgress.current) return null;
    fetchInProgress.current = true;
    
    try {
      console.log("Attempting to fetch rent amount for agreement ID:", agreementId);
      
      const { data, error } = await supabase
        .from("leases")
        .select("rent_amount, total_amount")
        .eq("id", agreementId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching rent amount:", error);
        errorCount.current += 1;
        
        if (errorCount.current > 3) {
          toast.error("Unable to fetch rental amount information");
        }
        return null;
      }
      
      if (data) {
        console.log("Fetched rent data:", data);
        
        // If rent_amount is missing but we have total_amount, auto-update the agreement
        if (!data.rent_amount && data.total_amount) {
          console.log(`Agreement has no rent_amount, setting it to total_amount ${data.total_amount}`);
          
          const { error: updateError } = await supabase
            .from('leases')
            .update({ rent_amount: data.total_amount })
            .eq('id', agreementId);
            
          if (updateError) {
            console.error("Error updating rent_amount:", updateError);
          } else {
            console.log("Successfully updated rent_amount");
          }
          
          return data.total_amount;
        }
        
        // First try to use rent_amount, if not available use total_amount
        const amount = data.rent_amount || data.total_amount;
        
        if (amount) {
          console.log("Using amount for calculations:", amount);
          return amount;
        } else {
          // If both are missing, set a default amount
          const defaultAmount = 1500; // Default rent in QAR
          console.log(`No rent amount found, setting default of ${defaultAmount}`);
          
          const { error: updateError } = await supabase
            .from('leases')
            .update({ rent_amount: defaultAmount })
            .eq('id', agreementId);
            
          if (updateError) {
            console.error("Error setting default rent amount:", updateError);
          } else {
            console.log("Successfully set default rent amount");
          }
          
          return defaultAmount;
        }
      } else {
        console.log("No rent data returned for agreement ID:", agreementId);
      }
      return null;
    } catch (error) {
      console.error("Error in fetchRentAmount:", error);
      return null;
    } finally {
      fetchInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadRentAmount = async () => {
      if (!agreementId) {
        console.log("No agreement ID provided to useRentAmount");
        return;
      }
      
      // Get the rent_amount directly from the leases table
      const leaseRentAmount = await fetchRentAmount(agreementId);
      
      if (leaseRentAmount !== null && isActive) {
        // Set the rent amount state
        console.log("Setting rent amount to:", leaseRentAmount);
        setRentAmount(leaseRentAmount);
        hasInitiallyFetched.current = true;
        
        // Calculate contract amount if we have agreement dates
        if (agreement?.start_date && agreement?.end_date) {
          try {
            // Ensure we're working with JS Date objects
            const startDate = agreement.start_date instanceof Date 
              ? agreement.start_date 
              : new Date(agreement.start_date);
            
            const endDate = agreement.end_date instanceof Date
              ? agreement.end_date
              : new Date(agreement.end_date);
            
            const durationMonths = differenceInMonths(endDate, startDate);
            const finalDuration = durationMonths > 0 ? durationMonths : 1;
            const calculatedContractAmount = leaseRentAmount * finalDuration;
            
            console.log(`Contract duration: ${finalDuration} months, Contract amount: ${calculatedContractAmount}`);
            setContractAmount(calculatedContractAmount);
          } catch (err) {
            console.error("Error calculating contract amount:", err);
          }
        } else {
          console.log("Agreement dates not available for contract amount calculation");
        }
      }
    };
    
    if (!hasInitiallyFetched.current || (agreement && !rentAmount)) {
      console.log("Initiating rent amount loading for agreement ID:", agreementId);
      loadRentAmount();
    }
    
    return () => {
      isActive = false;
    };
  }, [agreementId, agreement, fetchRentAmount, rentAmount]);

  // If agreement has direct total_amount but no rent amount was fetched yet
  useEffect(() => {
    if (agreement?.total_amount && !rentAmount) {
      console.log("Using agreement.total_amount as fallback:", agreement.total_amount);
      setRentAmount(agreement.total_amount);
      
      if (agreement.start_date && agreement.end_date) {
        try {
          // Ensure we're working with JS Date objects
          const startDate = agreement.start_date instanceof Date 
            ? agreement.start_date 
            : new Date(agreement.start_date);
          
          const endDate = agreement.end_date instanceof Date
            ? agreement.end_date
            : new Date(agreement.end_date);
            
          const durationMonths = differenceInMonths(endDate, startDate);
          const finalDuration = durationMonths > 0 ? durationMonths : 1;
          const calculatedContractAmount = agreement.total_amount * finalDuration;
          setContractAmount(calculatedContractAmount);
        } catch (err) {
          console.error("Error calculating contract amount from total_amount:", err);
        }
      }
    }
  }, [agreement, rentAmount]);

  // Log state changes for debugging
  useEffect(() => {
    console.log("useRentAmount state:", { 
      rentAmount, 
      contractAmount, 
      agreementId,
      hasAgreement: !!agreement,
      agreementDates: agreement ? {
        startDate: agreement.start_date,
        endDate: agreement.end_date,
        isStartDateDate: agreement.start_date instanceof Date,
        isEndDateDate: agreement.end_date instanceof Date
      } : null
    });
  }, [rentAmount, contractAmount, agreementId, agreement]);

  return { rentAmount, contractAmount };
};
