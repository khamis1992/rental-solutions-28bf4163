
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { castDbId } from '@/utils/supabase-type-helpers';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { generatePaymentSchedule } from './payment-schedule';

/**
 * Updates an agreement with proper validation and status transitions
 */
export const updateAgreementWithCheck = async (
  { id, data }: { id: string; data: Partial<Agreement> },
  userId?: string | null,
  onSuccess?: () => void,
  onError?: (error: any) => void,
  onStatusUpdate?: (status: string) => void
) => {
  // Track if there's a status change that needs special handling
  const isChangingToActive = data.status === 'active';
  const isChangingToClosed = data.status === 'closed';
  
  try {
    if (onStatusUpdate) onStatusUpdate("Updating agreement details...");
    console.log(`Updating agreement ${id} with data:`, data);

    // First, perform the basic agreement update
    const { error: updateError } = await supabase
      .from('leases')
      .update(data)
      .eq('id', castDbId(id));

    if (updateError) {
      console.error("Error updating agreement:", updateError);
      toast.error(`Failed to update agreement: ${updateError.message}`);
      if (onError) onError(updateError);
      return;
    }

    // Handle status-specific operations asynchronously
    if (isChangingToActive) {
      if (onStatusUpdate) onStatusUpdate("Agreement updated. Processing payment schedule...");
      
      // Run payment schedule generation in the background
      processingPaymentSchedule(id, onStatusUpdate).then(result => {
        if (result.success) {
          if (onStatusUpdate) onStatusUpdate("Payment schedule generated successfully");
          toast.success("Payment schedule generated successfully");
        } else {
          toast.error(`Payment schedule issue: ${result.message}`);
          // This doesn't block the main flow, just informs the user
        }
      }).catch(error => {
        console.error("Background payment schedule error:", error);
        toast.error("There was an issue with the payment schedule");
      });
    } 
    else if (isChangingToClosed) {
      // Handle agreement closing operations
      if (onStatusUpdate) onStatusUpdate("Finalizing agreement closure...");
      
      // Add specific closing operations here if needed
      setTimeout(() => {
        if (onStatusUpdate) onStatusUpdate("Agreement closed successfully");
      }, 1000);
    }

    // Allow the main flow to complete regardless of background tasks
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error("Error in updateAgreementWithCheck:", error);
    toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
    if (onError) onError(error);
  }
};

/**
 * Handles the payment schedule processing with proper status updates and error handling
 */
const processingPaymentSchedule = async (
  agreementId: string, 
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message?: string }> => {
  try {
    if (onStatusUpdate) onStatusUpdate("Checking agreement details...");
    
    // First, get the agreement details
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('*')
      .eq('id', castDbId(agreementId))
      .single();

    if (agreementError || !agreement) {
      console.error("Error fetching agreement for payment schedule:", agreementError);
      return { success: false, message: agreementError?.message || "Agreement not found" };
    }

    if (onStatusUpdate) onStatusUpdate("Generating payment schedule...");
    
    // Set a timeout to prevent infinite processing
    const timeoutPromise = new Promise<{ success: false; message: string }>((_, reject) => {
      setTimeout(() => reject({ success: false, message: "Payment schedule generation timed out" }), 10000);
    });
    
    try {
      // Race between the generation and timeout
      const result = await Promise.race([
        generatePaymentSchedule(agreement, onStatusUpdate),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error("Error in payment schedule generation:", error);
      return { 
        success: false, 
        message: `Failed to generate payment schedule: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  } catch (error) {
    console.error("Error in processingPaymentSchedule:", error);
    return { 
      success: false, 
      message: `Failed to process payment schedule: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
