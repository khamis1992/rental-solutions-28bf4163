import { supabase } from '@/lib/supabase';
import { AgreementStatus } from '@/types/agreement';

export interface VehicleAgreement {
  id: string;
  vehicle_id: string;
  customer_id: string;
  start_date: Date | string;
  end_date: Date | string;
  status: string;
  agreement_number?: string;
  total_amount?: number;
}

export enum DB_AGREEMENT_STATUS {
  PENDING_PAYMENT = 'pending_payment',
  PENDING_DEPOSIT = 'pending_deposit',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
  TERMINATED = 'terminated',
  ARCHIVED = 'archived',
  DRAFT = 'draft'
}

type DatabaseAgreementStatus = 
  | 'pending_payment'
  | 'pending_deposit'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'closed'
  | 'terminated'
  | 'archived'
  | 'draft';

export function mapToDBStatus(status: AgreementStatus): DatabaseAgreementStatus {
  switch(status) {
    case AgreementStatus.PENDING_PAYMENT:
      return 'pending_payment';
    case AgreementStatus.PENDING_DEPOSIT:
      return 'pending_deposit';
    case AgreementStatus.ACTIVE:
      return 'active';
    case AgreementStatus.COMPLETED:
      return 'completed';
    case AgreementStatus.CANCELLED:
      return 'cancelled';
    case AgreementStatus.CLOSED:
      return 'closed';
    case AgreementStatus.TERMINATED:
      return 'terminated';
    case AgreementStatus.ARCHIVED:
      return 'archived';
    default:
      return 'pending_payment';
  }
}

export function mapFromDBStatus(dbStatus: DatabaseAgreementStatus): AgreementStatus {
  switch(dbStatus) {
    case 'pending_payment':
      return AgreementStatus.PENDING_PAYMENT;
    case 'pending_deposit':
      return AgreementStatus.PENDING_DEPOSIT;
    case 'active':
      return AgreementStatus.ACTIVE;
    case 'completed':
      return AgreementStatus.COMPLETED;
    case 'cancelled':
      return AgreementStatus.CANCELLED;
    case 'closed':
      return AgreementStatus.CLOSED;
    case 'terminated':
      return AgreementStatus.TERMINATED;
    case 'archived':
      return AgreementStatus.ARCHIVED;
    case 'draft':
      return AgreementStatus.PENDING_PAYMENT;
    default:
      return AgreementStatus.PENDING_PAYMENT;
  }
}

const updateAgreementStatus = async (agreementId: string, newStatus: DatabaseAgreementStatus) => {
  const { error } = await supabase
    .from('leases')
    .update({ status: newStatus })
    .eq('id', agreementId);

  if (error) {
    console.error('Error updating agreement status:', error);
    return false;
  }
  
  return true;
};

export const createDraftAgreement = async (customerData: any) => {
  try {
    const { data, error } = await supabase
      .from('leases')
      .insert({
        customer_id: customerData.id,
        status: 'draft' as DatabaseAgreementStatus
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create draft agreement: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in createDraftAgreement:', error);
    throw error;
  }
};

export const updateAnalysisData = async (agreementId: string, analysisData: any) => {
  try {
    const { data, error } = await supabase.rpc(
      'update_agreement_analysis' as any,
      { 
        agreement_id: agreementId, 
        analysis_data: analysisData 
      }
    );

    if (error) {
      console.error('Error updating analysis data:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateAnalysisData:', error);
    return false;
  }
};

export const checkVehicleUsageConflicts = async (
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeAgreementId?: string
): Promise<{ hasConflict: boolean; conflictingAgreements?: VehicleAgreement[] }> => {
  return { hasConflict: false };
};

export const checkAgreementOverlap = (
  existingAgreement: VehicleAgreement,
  startDate: Date,
  endDate: Date
): boolean => {
  return false;
};

export const checkAndUpdateConflictingAgreements = async (): Promise<{
  success: boolean;
  updatedCount: number;
  aiAnalyzedCount: number;
  message: string;
}> => {
  try {
    console.log("Starting agreement status check for conflicting vehicle assignments");
    
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

    const agreementsByVehicle = activeAgreements.reduce((acc, agreement) => {
      if (!acc[agreement.vehicle_id]) {
        acc[agreement.vehicle_id] = [];
      }
      acc[agreement.vehicle_id].push(agreement as VehicleAgreement);
      return acc;
    }, {} as Record<string, VehicleAgreement[]>);

    let updatedCount = 0;
    let aiAnalyzedCount = 0;

    for (const [vehicleId, agreements] of Object.entries(agreementsByVehicle)) {
      if (agreements.length > 1) {
        const sortedAgreements = agreements.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const [newestAgreement, ...olderAgreements] = sortedAgreements;

        console.log(`Vehicle ${vehicleId} has ${agreements.length} active agreements. Keeping newest (${newestAgreement.id}) and cancelling others.`);

        for (const agreement of olderAgreements) {
          const { error: updateError } = await updateAgreementStatus(agreement.id, DB_AGREEMENT_STATUS.CANCELLED);
          if (updateError) {
            console.error(`Error updating agreement ${agreement.id}:`, updateError);
            continue;
          }

          updatedCount++;
          console.log(`Updated agreement ${agreement.id} to cancelled status`);
        }
      }
    }

    console.log("Starting AI analysis of agreements");
    const analysisResults: EnhancedAnalysisResult[] = [];
    
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
      for (const agreement of agreementsForAnalysis) {
        try {
          const analysis = await analyzeAgreementStatus(agreement);
          
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
            historical_data: {},
            payment_factors: {},
            vehicle_factors: {},
            customer_factors: {},
            risk_factors: {},
            trend_analysis: {},
            model_version: '1.0'
          };
          
          analysisResults.push(enhancedAnalysis);
          
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
          
          if (
            analysis.confidence > 0.85 && 
            analysis.riskLevel === 'high' && 
            analysis.recommendedStatus !== agreement.status &&
            Object.values(DB_AGREEMENT_STATUS).includes(
              analysis.recommendedStatus as any
            )
          ) {
            const validStatus = Object.values(DB_AGREEMENT_STATUS).includes(
              analysis.recommendedStatus as any
            );
            
            if (validStatus) {
              const statusToUpdate = analysis.recommendedStatus as DatabaseAgreementStatus;
              const { error: statusError } = await updateAgreementStatus(agreement.id, statusToUpdate);
              
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
