
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseAgreementStatus, DB_AGREEMENT_STATUS } from '@/lib/validation-schemas/agreement';
import { analyzeAgreementStatus } from '@/utils/translation-utils';
import { EnhancedAnalysisResult } from '@/utils/type-utils';

interface VehicleAgreement {
  id: string;
  vehicle_id: string;
  customer_id: string;
  status: DatabaseAgreementStatus;
  created_at: string;
}

export const checkAndUpdateConflictingAgreements = async (): Promise<{
  success: boolean;
  updatedCount: number;
  aiAnalyzedCount: number;
  message: string;
}> => {
  try {
    console.log("Starting agreement status check for conflicting vehicle assignments");
    
    // Get all active agreements
    const { data: activeAgreements, error: fetchError } = await supabase
      .from('leases')
      .select('id, vehicle_id, customer_id, status, created_at')
      .in('status', [DB_AGREEMENT_STATUS.ACTIVE, DB_AGREEMENT_STATUS.PENDING_PAYMENT])
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error("Error fetching agreements:", fetchError);
      return {
        success: false,
        updatedCount: 0,
        aiAnalyzedCount: 0,
        message: `Error fetching agreements: ${fetchError.message}`
      };
    }

    if (!activeAgreements || activeAgreements.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        aiAnalyzedCount: 0,
        message: "No active agreements found to check"
      };
    }

    // Group agreements by vehicle_id
    const agreementsByVehicle = activeAgreements.reduce((acc, agreement) => {
      if (!acc[agreement.vehicle_id]) {
        acc[agreement.vehicle_id] = [];
      }
      acc[agreement.vehicle_id].push(agreement as VehicleAgreement);
      return acc;
    }, {} as Record<string, VehicleAgreement[]>);

    let updatedCount = 0;
    let aiAnalyzedCount = 0;

    // Check each vehicle's agreements
    for (const [vehicleId, agreements] of Object.entries(agreementsByVehicle)) {
      if (agreements.length > 1) {
        // Sort by created_at in descending order (newest first)
        const sortedAgreements = agreements.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Keep the newest agreement active, cancel all others
        const [newestAgreement, ...olderAgreements] = sortedAgreements;

        console.log(`Vehicle ${vehicleId} has ${agreements.length} active agreements. Keeping newest (${newestAgreement.id}) and cancelling others.`);

        // Update older agreements to cancelled status
        for (const agreement of olderAgreements) {
          const { error: updateError } = await supabase
            .from('leases')
            .update({ 
              status: DB_AGREEMENT_STATUS.CANCELLED,
              updated_at: new Date().toISOString()
            })
            .eq('id', agreement.id);

          if (updateError) {
            console.error(`Error updating agreement ${agreement.id}:`, updateError);
            continue;
          }

          updatedCount++;
          console.log(`Updated agreement ${agreement.id} to cancelled status`);
        }
      }
    }

    // Now perform AI analysis on all agreements with detailed information
    console.log("Starting AI analysis of agreements");
    const analysisResults: EnhancedAnalysisResult[] = [];
    
    // Get all active and pending agreements with more details
    const { data: agreementsForAnalysis, error: detailError } = await supabase
      .from('leases')
      .select(`
        id, 
        customer_id, 
        vehicle_id, 
        start_date, 
        end_date, 
        status, 
        total_amount, 
        deposit_amount,
        agreement_number
      `)
      .in('status', [
        DB_AGREEMENT_STATUS.ACTIVE, 
        DB_AGREEMENT_STATUS.PENDING_PAYMENT,
        DB_AGREEMENT_STATUS.DRAFT 
      ]);
      
    if (detailError) {
      console.error("Error fetching agreements for analysis:", detailError);
    } else if (agreementsForAnalysis && agreementsForAnalysis.length > 0) {
      // Process each agreement with AI
      for (const agreement of agreementsForAnalysis) {
        try {
          const analysis = await analyzeAgreementStatus(agreement);
          
          // Enhanced analysis with additional factors
          const enhancedAnalysis: EnhancedAnalysisResult = {
            id: agreement.id,
            agreement_id: agreement.id,
            recommended_status: analysis.recommendedStatus,
            confidence: analysis.confidence,
            current_status: agreement.status,
            risk_level: analysis.riskLevel as 'low' | 'medium' | 'high',
            analyzed_at: analysis.analyzedAt,
            explanation: analysis.explanation,
            action_items: analysis.actionItems || [],
            historical_data: {}, // Will be populated in future versions
            payment_factors: {}, // Will be populated in future versions
            vehicle_factors: {}, // Will be populated in future versions
            customer_factors: {}, // Will be populated in future versions
            risk_factors: {}, // Will be populated in future versions
            trend_analysis: {}, // Will be populated in future versions
            model_version: '1.0' // Initial version
          };
          
          analysisResults.push(enhancedAnalysis);
          
          // Update the database with analysis results using RPC
          try {
            const { error } = await supabase.rpc('upsert_agreement_analysis', {
              p_agreement_id: agreement.id,
              p_recommended_status: analysis.recommendedStatus,
              p_confidence: analysis.confidence,
              p_current_status: agreement.status,
              p_risk_level: analysis.riskLevel,
              p_analyzed_at: analysis.analyzedAt,
              p_explanation: analysis.explanation,
              p_action_items: analysis.actionItems || []
            });
            
            if (error) {
              console.error(`Error saving analysis results for agreement ${agreement.id}:`, error);
            } else {
              aiAnalyzedCount++;
            }
          } catch (dbError) {
            console.error(`Error saving analysis to database for agreement ${agreement.id}:`, dbError);
          }
          
          // If high confidence and risk level is high, auto-update the agreement status
          if (
            analysis.confidence > 0.85 && 
            analysis.riskLevel === 'high' && 
            analysis.recommendedStatus !== agreement.status &&
            Object.values(DB_AGREEMENT_STATUS).includes(
              analysis.recommendedStatus as any
            )
          ) {
            // Ensure the recommendedStatus is a valid DatabaseAgreementStatus
            const validStatus = Object.values(DB_AGREEMENT_STATUS).includes(
              analysis.recommendedStatus as any
            );
            
            if (validStatus) {
              // Convert string to DatabaseAgreementStatus
              const statusToUpdate = analysis.recommendedStatus as DatabaseAgreementStatus;
              const { error: statusError } = await supabase
                .from('leases')
                .update({ 
                  status: statusToUpdate,
                  updated_at: new Date().toISOString(),
                  last_ai_update: new Date().toISOString()
                })
                .eq('id', agreement.id);
                
              if (statusError) {
                console.error(`Error auto-updating agreement ${agreement.id} status:`, statusError);
              } else {
                updatedCount++;
                console.log(`Auto-updated agreement ${agreement.id} status from ${agreement.status} to ${analysis.recommendedStatus} based on AI recommendation`);
              }
            } else {
              console.warn(`Recommended status "${analysis.recommendedStatus}" is not valid for agreement ${agreement.id}`);
            }
          }
        } catch (error) {
          console.error(`Error analyzing agreement ${agreement.id}:`, error);
          continue;
        }
      }
    }

    // Create a message summarizing what was done
    const message = [
      updatedCount > 0 ? `Updated ${updatedCount} agreement statuses` : "No status updates needed",
      aiAnalyzedCount > 0 ? `Analyzed ${aiAnalyzedCount} agreements with AI` : "No agreements analyzed"
    ].join(". ");

    return {
      success: true,
      updatedCount,
      aiAnalyzedCount,
      message
    };
  } catch (error) {
    console.error("Unexpected error in checkAndUpdateConflictingAgreements:", error);
    return {
      success: false,
      updatedCount: 0,
      aiAnalyzedCount: 0,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Function to run the check manually (can be triggered from UI)
export const runAgreementStatusCheck = async (): Promise<void> => {
  try {
    toast.info("Checking agreement statuses with AI assistance...");
    
    const result = await checkAndUpdateConflictingAgreements();
    
    if (result.success) {
      if (result.updatedCount > 0 || result.aiAnalyzedCount > 0) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    console.error("Error in runAgreementStatusCheck:", error);
    toast.error("Failed to check agreement statuses");
  }
};
