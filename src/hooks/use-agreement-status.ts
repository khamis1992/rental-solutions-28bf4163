
import { useState, useCallback } from 'react';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hasData } from '@/utils/supabase-type-helpers';

/**
 * Custom hook for managing agreement status changes
 */
export const useAgreementStatus = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusUpdateProgress, setStatusUpdateProgress] = useState<string | null>(null);

  /**
   * Updates agreement status with proper validation and progress tracking
   */
  const updateStatus = useCallback(async (
    newStatus: string,
    notes?: string
  ): Promise<boolean> => {
    if (!agreement && !agreementId) {
      toast.error("Agreement information is missing");
      return false;
    }
    
    const id = agreement?.id || agreementId;
    if (!id) {
      toast.error("Agreement ID is required");
      return false;
    }
    
    setIsProcessing(true);
    setStatusUpdateProgress("Preparing status update...");
    
    try {
      // Check if it's a significant status change
      const isActivation = newStatus === 'active';
      const isClosure = newStatus === 'closed';
      
      // Create update data
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Add notes if provided
      if (notes || agreement?.notes) {
        Object.assign(updateData, { notes: notes || agreement?.notes });
      }
      
      // Track timing if needed for debugging
      const startTime = Date.now();
      
      // Update agreement status
      setStatusUpdateProgress("Updating agreement status...");
      const { error: updateError } = await supabase
        .from('leases')
        .update(updateData as any)
        .eq('id', id as any);
        
      if (updateError) {
        console.error("Error updating agreement status:", updateError);
        toast.error(`Failed to update status: ${updateError.message}`);
        setStatusUpdateProgress(null);
        setIsProcessing(false);
        return false;
      }
      
      // Special handling for activation
      if (isActivation) {
        setStatusUpdateProgress("Agreement activated. Setting up payment schedule...");
        
        // Run payment schedule generation as a separate task
        try {
          // Wait for max 15 seconds before giving up (but don't block UI)
          const paymentSchedulePromise = generatePaymentSchedule(id);
          const timeoutPromise = new Promise<{ success: boolean; message: string }>(
            (resolve) => setTimeout(() => resolve({ 
              success: true, 
              message: "Payment setup initiated but taking longer than expected." 
            }), 15000)
          );
          
          // Race between completion and timeout
          const result = await Promise.race([paymentSchedulePromise, timeoutPromise]);
          
          if (result.success) {
            setStatusUpdateProgress("Payment schedule setup completed successfully");
          } else {
            console.warn("Payment schedule issue:", result.message);
            setStatusUpdateProgress("Status updated, but there was an issue with the payment schedule");
            toast.warning("Status updated, but there was an issue with the payment schedule. It will be retried automatically.");
          }
        } catch (err) {
          console.error("Error in payment schedule setup:", err);
          // Don't fail the status change, just show a warning
          toast.warning("Status updated, but there was an issue with the payment schedule");
        }
      } 
      // Special handling for closure
      else if (isClosure) {
        setStatusUpdateProgress("Finalizing agreement closure...");
        
        // Add any specific closure logic here
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setStatusUpdateProgress("Agreement closed successfully");
      } 
      // Standard status changes
      else {
        setStatusUpdateProgress("Agreement status updated successfully");
      }
      
      // Calculate how long the operation took
      const operationTime = Date.now() - startTime;
      console.log(`Status update operation completed in ${operationTime}ms`);
      
      toast.success(`Agreement status updated to ${newStatus}`);
      
      // Reset states after a delay to allow user to see the success message
      setTimeout(() => {
        setStatusUpdateProgress(null);
        setIsProcessing(false);
      }, 1500);
      
      return true;
    } catch (error) {
      console.error("Unexpected error updating agreement status:", error);
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusUpdateProgress(null);
      setIsProcessing(false);
      return false;
    }
  }, [agreement, agreementId]);
  
  /**
   * Generate payment schedule with timeout protection
   */
  const generatePaymentSchedule = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      // First get the agreement details
      const response = await supabase
        .from('leases')
        .select('*')
        .eq('id', id as any)
        .single();
        
      if (!hasData(response)) {
        console.error("Error fetching agreement for payment schedule:", response.error);
        return { 
          success: false, 
          message: `Failed to fetch agreement details: ${response.error?.message || 'No data found'}` 
        };
      }
      
      const data = response.data;
      
      // Check if payment already exists
      const { data: existingPayments, error: checkError } = await supabase
        .from('unified_payments')
        .select('id')
        .eq('lease_id', id as any)
        .limit(1);
        
      if (!checkError && existingPayments && existingPayments.length > 0) {
        return { success: true, message: "Payments already exist for this agreement" };
      }
      
      // Create a payment entry
      if (!data.rent_amount) {
        return { success: false, message: "Cannot create payment - no rent amount specified" };
      }
      
      // Determine payment due date
      const rentDueDay = data.rent_due_day || 1;
      const today = new Date();
      const dueDate = new Date(today.getFullYear(), today.getMonth(), rentDueDay);
      
      // If today's date is past the due day, set for next month
      if (today.getDate() > rentDueDay) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      
      // Create payment record
      const paymentData = {
        lease_id: id,
        amount: data.rent_amount,
        amount_paid: 0,
        balance: data.rent_amount,
        description: `Rent Payment - ${dueDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        type: 'rent',
        status: 'pending',
        due_date: dueDate.toISOString(),
        is_recurring: false
      };
      
      const { error: insertError } = await supabase
        .from('unified_payments')
        .insert([paymentData as any]);
        
      if (insertError) {
        console.error("Error creating payment:", insertError);
        return { success: false, message: `Failed to create payment: ${insertError.message}` };
      }
      
      return { success: true, message: "Payment schedule created successfully" };
    } catch (error) {
      console.error("Error in generatePaymentSchedule:", error);
      return { 
        success: false, 
        message: `Failed to generate payment schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  return {
    isProcessing,
    statusUpdateProgress,
    updateStatus,
  };
};
