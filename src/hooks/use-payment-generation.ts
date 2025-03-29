
import { useState, useCallback, useEffect, useRef } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import { forceCheckAllAgreementsForPayments, forceGeneratePaymentsForMissingMonths } from '@/lib/supabase';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const paymentGenerationAttempted = useRef(false);
  const isProcessing = useRef(false);
  
  const refreshAgreementData = useCallback(() => {
    // Increment refresh trigger to force a refresh
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Function to handle special payments for agreement MR202462
  const handleSpecialAgreementPayments = useCallback(async (agreementData: Agreement, rentAmt: number) => {
    if (agreementData.agreement_number !== 'MR202462' || isProcessing.current) return;
    
    isProcessing.current = true;
    console.log(`Special check for agreement ${agreementData.agreement_number} to catch up missing payments`);
    
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

  // Handle payment generation for active agreements
  useEffect(() => {
    // Skip if we don't have the necessary data yet or already attempted or processing
    if (!agreement || !agreementId || paymentGenerationAttempted.current || isProcessing.current) return;
    
    let isActive = true;
    
    const generatePayments = async () => {
      try {
        isProcessing.current = true;
        paymentGenerationAttempted.current = true;
        
        if (agreement.status === 'active') {
          console.log(`Checking for missing payments for agreement ${agreement.agreement_number}...`);
          
          // Force check all agreements for current month payments (only once)
          const allResult = await forceCheckAllAgreementsForPayments();
          
          if (!isActive) return;
          
          if (allResult.success) {
            console.log("Payment check completed:", allResult);
            if (allResult.generated > 0) {
              toast.success(`Generated ${allResult.generated} new payments for active agreements`);
            }
          }
          
          // Special handling for agreement with MR202462 number
          if (agreement.agreement_number === 'MR202462' && agreement.total_amount) {
            await handleSpecialAgreementPayments(agreement, agreement.total_amount);
          }
        }
      } catch (error) {
        console.error("Error generating payments:", error);
      } finally {
        if (isActive) {
          isProcessing.current = false;
        }
      }
    };
    
    generatePayments();
    
    return () => {
      isActive = false;
    };
  }, [agreement, agreementId, handleSpecialAgreementPayments]);

  return { refreshTrigger, refreshAgreementData };
};
