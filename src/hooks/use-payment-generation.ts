
import { useState, useCallback, useRef } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import { forceCheckAllAgreementsForPayments, forceGeneratePaymentsForMissingMonths } from '@/lib/supabase';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const paymentGenerationAttempted = useRef(false);
  const isProcessing = useRef(false);
  
  const refreshAgreementData = useCallback(() => {
    // Increment refresh trigger to force a refresh
    console.log("Triggering agreement data refresh");
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Function to handle special payments for agreement MR202462
  const handleSpecialAgreementPayments = useCallback(async (agreementData: Agreement, rentAmt: number) => {
    if (!agreementData?.agreement_number) {
      console.warn("Cannot process special agreement: missing agreement number");
      return;
    }
    
    if (agreementData.agreement_number !== 'MR202462' || isProcessing.current) {
      return;
    }
    
    isProcessing.current = true;
    console.log(`Special check for agreement ${agreementData.agreement_number} to catch up missing payments with rent amount ${rentAmt}`);
    
    try {
      // Create explicit date objects for the date range
      // August 3, 2024 to March 22, 2025
      const lastKnownPaymentDate = new Date(2024, 7, 3); // Month is 0-indexed (7 = August)
      const currentSystemDate = new Date(2025, 2, 22); // 2 = March, 22 = day
      
      console.log(`Looking for missing payments between ${lastKnownPaymentDate.toISOString()} and ${currentSystemDate.toISOString()}`);
      
      // Generate payments for each month in the date range
      const missingResult = await forceGeneratePaymentsForMissingMonths(
        agreementData.id,
        rentAmt,
        lastKnownPaymentDate,
        currentSystemDate
      );
      
      if (missingResult.success) {
        console.log("Missing payments check completed:", missingResult);
        if (missingResult.generated > 0) {
          toast.success(`Generated ${missingResult.generated} missing monthly payments for ${agreementData.agreement_number}`);
        } else {
          console.log("No missing payments were generated, all months might be covered already");
        }
      } else {
        console.error("Failed to generate missing payments:", missingResult);
      }
    } catch (error) {
      console.error("Error in handleSpecialAgreementPayments:", error);
    } finally {
      isProcessing.current = false;
    }
  }, []);

  return { refreshTrigger, refreshAgreementData, handleSpecialAgreementPayments };
};
