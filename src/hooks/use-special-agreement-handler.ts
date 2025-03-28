
import { useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { forceCheckAllAgreementsForPayments, forceGeneratePaymentsForMissingMonths, supabase } from '@/lib/supabase';

export function useSpecialAgreementHandler(
  agreementId: string | undefined,
  agreementNumber: string | undefined,
  isInitialized: boolean
) {
  const paymentGenerationAttemptedRef = useRef(false);
  
  const handleSpecialAgreement = useCallback(async () => {
    if (!agreementId || !agreementNumber || !isInitialized || paymentGenerationAttemptedRef.current) {
      return;
    }
    
    paymentGenerationAttemptedRef.current = true;
    
    try {
      // Force check all agreements for current month payments
      const allResult = await forceCheckAllAgreementsForPayments();
      if (allResult.success) {
        console.log("Payment check completed:", allResult);
        if (allResult.generated > 0) {
          toast.success(`Generated ${allResult.generated} new payments for active agreements`);
        }
      }
      
      // Special handling for agreement with MR202462 number
      if (agreementNumber === 'MR202462') {
        console.log(`Special check for agreement ${agreementNumber} to catch up missing payments`);
        
        // Create explicit date objects for the date range
        // August 3, 2024 to March 22, 2025
        const lastKnownPaymentDate = new Date(2024, 7, 3); // Month is 0-indexed (7 = August)
        const currentSystemDate = new Date(2025, 2, 22); // 2 = March, 22 = day
        
        console.log(`Looking for missing payments between ${lastKnownPaymentDate.toISOString()} and ${currentSystemDate.toISOString()}`);
        
        // Get the actual rent amount to use for generating payments
        let rentAmount;
        try {
          const { data: leaseData } = await supabase
            .from("leases")
            .select("rent_amount")
            .eq("id", agreementId)
            .single();
          
          if (leaseData && leaseData.rent_amount) {
            rentAmount = leaseData.rent_amount;
            console.log(`Using rent_amount from leases table: ${rentAmount}`);
          }
        } catch (err) {
          console.error("Error fetching rent amount for missing payments:", err);
        }
        
        if (!rentAmount) {
          console.log("No rent amount found, cannot generate missing payments");
          return;
        }
        
        // Generate payments for each month in the date range
        const missingResult = await forceGeneratePaymentsForMissingMonths(
          agreementId,
          rentAmount,
          lastKnownPaymentDate,
          currentSystemDate
        );
        
        if (missingResult.success) {
          console.log("Missing payments check completed:", missingResult);
          if (missingResult.generated > 0) {
            toast.success(`Generated ${missingResult.generated} missing monthly payments for ${agreementNumber}`);
          } else {
            console.log("No missing payments were generated, all months might be covered already");
          }
        } else {
          console.error("Failed to generate missing payments:", missingResult);
        }
      }
    } catch (error) {
      console.error("Error in special agreement handling:", error);
    }
  }, [agreementId, agreementNumber, isInitialized]);

  useEffect(() => {
    handleSpecialAgreement();
  }, [handleSpecialAgreement]);

  return null;
}
