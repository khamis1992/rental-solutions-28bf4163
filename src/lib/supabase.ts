import { createClient } from "@supabase/supabase-js";
import { generateMonthlyPayment } from "./validation-schemas/agreement";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vqdlsidkucrownbfuouq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to generate payments for missing months in date range
export const forceGeneratePaymentsForMissingMonths = async (
  agreementId: string,
  amount: number,
  startDate: Date,
  endDate: Date
) => {
  let generated = 0;
  const errors = [];
  
  try {
    console.log(`Generating payments for agreement ${agreementId} from ${startDate} to ${endDate}`);
    
    // Get lease details to verify it exists and is active
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("status, agreement_number")
      .eq("id", agreementId)
      .single();
      
    if (leaseError) {
      console.error("Error fetching lease:", leaseError);
      return { success: false, error: leaseError };
    }
    
    if (!lease) {
      console.error("Lease not found");
      return { success: false, error: "Lease not found" };
    }
    
    if (lease.status !== 'active') {
      console.log(`Lease ${lease.agreement_number} is not active (${lease.status})`);
      return { success: false, message: `Lease is not active (${lease.status})` };
    }
    
    // Calculate months to generate
    const currentMonth = startDate.getMonth();
    const currentYear = startDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endYear = endDate.getFullYear();
    
    let year = currentYear;
    let month = currentMonth;
    
    console.log(`Generating payments from ${month}/${year} to ${endMonth}/${endYear}`);
    
    // Loop through each month in the range
    while (
      (year < endYear) || 
      (year === endYear && month <= endMonth)
    ) {
      console.log(`Checking month ${month}/${year} for agreement ${agreementId}`);
      
      // Try to generate payment for this month
      try {
        const result = await generateMonthlyPayment(
          supabase,
          agreementId,
          amount,
          month,
          year
        );
        
        if (result.success) {
          console.log(`Generated payment for ${month}/${year}`);
          generated++;
        } else if (result.message !== "Payment already exists for this month") {
          console.log(`Failed to generate payment for ${month}/${year}: ${result.message}`);
          errors.push({ month, year, error: result.message || "Unknown error" });
        }
      } catch (error) {
        console.error(`Error generating payment for ${month}/${year}:`, error);
        errors.push({ month, year, error: String(error) });
      }
      
      // Move to next month
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    
    return { 
      success: true, 
      generated, 
      errors: errors.length > 0 ? errors : null 
    };
  } catch (error) {
    console.error("Error in forceGeneratePaymentsForMissingMonths:", error);
    return { success: false, error };
  }
};

// Function to check all agreements for missing payments
export const forceCheckAllAgreementsForPayments = async () => {
  try {
    // Get all active agreements
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from("leases")
      .select("id, rent_amount, total_amount, agreement_number")
      .eq("status", "active");
      
    if (agreementsError) {
      console.error("Error fetching active agreements:", agreementsError);
      return { success: false, error: agreementsError };
    }
    
    console.log(`Found ${activeAgreements?.length || 0} active agreements to check`);
    
    const results = [];
    
    // Process each agreement
    for (const agreement of activeAgreements || []) {
      const rentAmount = agreement.rent_amount || agreement.total_amount;
      
      if (!rentAmount) {
        results.push({
          agreement: agreement.agreement_number,
          status: "skipped",
          reason: "No rent amount available"
        });
        continue;
      }
      
      try {
        console.log(`Checking payments for agreement ${agreement.agreement_number}`);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const result = await generateMonthlyPayment(
          supabase,
          agreement.id,
          rentAmount,
          currentMonth,
          currentYear
        );
        
        results.push({
          agreement: agreement.agreement_number,
          status: result.success ? "generated" : "skipped",
          reason: result.message || "Payment already exists"
        });
      } catch (error) {
        console.error(`Error processing agreement ${agreement.agreement_number}:`, error);
        results.push({
          agreement: agreement.agreement_number,
          status: "error",
          error: String(error)
        });
      }
    }
    
    return {
      success: true,
      processed: activeAgreements?.length || 0,
      results
    };
  } catch (error) {
    console.error("Error in forceCheckAllAgreementsForPayments:", error);
    return { success: false, error };
  }
};

// Helper function to check and generate monthly payments
export const checkAndGenerateMonthlyPayments = async (agreementId?: string, amount?: number) => {
  try {
    // Add a check to prevent excessive calls
    const lastCheckTime = localStorage.getItem('lastMonthlyPaymentCheck');
    const currentTime = Date.now();
    
    // Only run the check if it hasn't been run in the last hour (3600000 ms)
    if (lastCheckTime && currentTime - parseInt(lastCheckTime) < 3600000) {
      console.log("Skipping monthly payment check - already checked recently");
      return { success: true, message: "Check skipped - already run recently" };
    }
    
    localStorage.setItem('lastMonthlyPaymentCheck', currentTime.toString());
    
    if (agreementId && amount) {
      console.log(`Checking monthly payments for agreement ${agreementId} with amount ${amount}`);
      const today = new Date();
      const result = await generateMonthlyPayment(
        supabase,
        agreementId,
        amount,
        today.getMonth(),
        today.getFullYear()
      );
      
      return result;
    } else {
      console.log("No specific agreement provided, checking all agreements");
      return await forceCheckAllAgreementsForPayments();
    }
  } catch (error) {
    console.error("Error in checkAndGenerateMonthlyPayments:", error);
    return { success: false, error };
  }
};

// Enhanced function to manage import reverts with improved reliability
export const revertAgreementImport = async (importId: string, reason?: string) => {
  try {
    console.log(`Reverting import ${importId}`);
    
    // First get the import details
    const { data: importData, error: importError } = await supabase
      .from('agreement_imports')
      .select('*')
      .eq('id', importId)
      .single();
      
    if (importError) {
      console.error('Error fetching import:', importError);
      return { success: false, error: importError };
    }
    
    if (!importData) {
      return { success: false, message: 'Import not found' };
    }
    
    // Immediately update the import status to 'reverting' to prevent multiple clicks
    await supabase
      .from('agreement_imports')
      .update({ status: 'reverting' })
      .eq('id', importId);
    
    // Find agreements created by filename and created_at timeframe
    const originalFileName = importData.original_file_name;
    const startTime = new Date(importData.created_at);
    const endTime = new Date(importData.updated_at || importData.created_at);
    endTime.setMinutes(endTime.getMinutes() + 10); // Add 10-minute buffer
    
    console.log(`Reverting agreements created between ${startTime.toISOString()} and ${endTime.toISOString()}`);
    console.log(`Looking for agreements imported from file: ${originalFileName}`);
    
    // First, find all agreements created in this timeframe
    const { data: agreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());
    
    if (agreementsError) {
      console.error('Error finding agreements:', agreementsError);
      // Continue anyway, as we'll try the RPC function as fallback
    }
    
    const agreementIds = agreements?.map(a => a.id) || [];
    console.log(`Found ${agreementIds.length} agreements to potentially delete`);
    
    // Try both methods: direct deletion and RPC function
    let deletedCount = 0;
    
    // Method 1: Direct deletion with explicit IDs if we found any
    if (agreementIds.length > 0) {
      try {
        // Delete dependent records first
        await supabase.from('payment_schedules').delete().in('lease_id', agreementIds);
        await supabase.from('unified_payments').delete().in('lease_id', agreementIds);
        
        // Now delete the actual agreements
        const { data: deletedData, error: deleteError } = await supabase
          .from('leases')
          .delete()
          .in('id', agreementIds)
          .select('id');
        
        if (deleteError) {
          console.error('Error with direct deletion:', deleteError);
        } else {
          deletedCount = deletedData?.length || 0;
          console.log(`Directly deleted ${deletedCount} agreements`);
        }
      } catch (directDeleteError) {
        console.error('Exception during direct deletion:', directDeleteError);
      }
    }
    
    // Method 2: Use the database function as a fallback or additional measure
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_agreements_by_import_id', {
        p_import_id: importId
      });
      
      if (rpcError) {
        console.error('Error with RPC function:', rpcError);
      } else if (rpcResult?.success) {
        // Add to our count from the RPC method
        deletedCount += rpcResult.deleted_count || 0;
        console.log(`RPC function deleted ${rpcResult.deleted_count} agreements`);
      }
    } catch (rpcError) {
      console.error('Exception during RPC function call:', rpcError);
    }
    
    // Log the revert operation
    await supabase.from('agreement_import_reverts').insert({
      import_id: importId,
      deleted_count: deletedCount,
      reason: reason || 'No reason provided'
    });
    
    // Update the import status to reverted
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'reverted',
        error_count: importData.error_count || 0,
        processed_count: 0 // Reset processed count since we've deleted the agreements
      })
      .eq('id', importId);
    
    return { 
      success: true, 
      deleted_count: deletedCount,
      message: `Successfully reverted import. ${deletedCount} agreements deleted.`
    };
  } catch (error) {
    console.error('Error in revertAgreementImport:', error);
    
    // Make sure to set the status back to its original state if we fail
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'failed',
        errors: { message: `Revert failed: ${error.message}` }
      })
      .eq('id', importId);
      
    return { success: false, error };
  }
};
