
import { supabase } from '@/lib/supabase';
import { checkAndUpdateConflictingAgreements } from './agreement-status-checker'; // Existing import

export const runAgreementStatusMaintenance = async () => {
  try {
    console.log("Running agreement status maintenance");
    
    // Check for conflicting vehicle assignments
    const conflictResult = await checkAndUpdateConflictingAgreements();
    
    if (!conflictResult.success) {
      return {
        success: false,
        message: `Failed to check conflicting agreements: ${conflictResult.message}`,
        error: conflictResult
      };
    }
    
    return {
      success: true,
      message: conflictResult.message
    };
  } catch (error) {
    console.error("Error in runAgreementStatusMaintenance:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};

// Add this new export to resolve the runtime error
export const runAgreementStatusCheck = runAgreementStatusMaintenance;
