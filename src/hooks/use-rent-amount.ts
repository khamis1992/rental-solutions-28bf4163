import { useState, useEffect, useCallback, useRef } from 'react';
import { Agreement } from '@/types/agreement';
import { supabase } from '@/integrations/supabase/client';
import { differenceInMonths } from 'date-fns';
import { toast } from 'sonner';

export const useRentAmount = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [rentAmount, setRentAmount] = useState<number | null>(null);
  const [contractAmount, setContractAmount] = useState<number | null>(null);
  const fetchInProgress = useRef(false);
  const hasInitiallyFetched = useRef(false);
  const errorCount = useRef(0);

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
        const amount = data.rent_amount || data.total_amount;
        
        if (amount) {
          console.log("Using amount for calculations:", amount);
          return amount;
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
      
      const leaseRentAmount = await fetchRentAmount(agreementId);
      
      if (leaseRentAmount !== null && isActive) {
        console.log("Setting rent amount to:", leaseRentAmount);
        setRentAmount(leaseRentAmount);
        hasInitiallyFetched.current = true;
        
        if (agreement?.start_date && agreement?.end_date) {
          try {
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

  useEffect(() => {
    if (agreement?.total_amount && !rentAmount) {
      console.log("Using agreement.total_amount as fallback:", agreement.total_amount);
      setRentAmount(agreement.total_amount);
      
      if (agreement.start_date && agreement.end_date) {
        try {
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
