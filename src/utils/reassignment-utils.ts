
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReassignmentDetails {
  sourceAgreementId: string;
  sourceAgreementNumber: string; 
  targetAgreementId: string;
  targetAgreementNumber: string;
  vehicleId: string;
  userId?: string; // The user who performed the reassignment
  reason?: string; // Why the vehicle was reassigned
  transferObligations?: boolean; // Whether to transfer payments/fines to new agreement
}

/**
 * Records a vehicle reassignment between agreements
 * @param details The details of the reassignment
 * @returns The ID of the new reassignment record
 */
export const recordVehicleReassignment = async (
  details: ReassignmentDetails
): Promise<string | null> => {
  try {
    // Get current timestamp for the record
    const reassignedAt = new Date().toISOString();
    
    // First, create the reassignment history record
    const { data, error } = await supabase
      .from('leases')  // Using the leases table for reassignment tracking
      .insert({
        // We're adapting the fields to use what's available in the leases table
        // instead of trying to use a non-existent vehicle_reassignments table
        vehicle_id: details.vehicleId,
        agreement_number: `Reassigned: ${details.sourceAgreementNumber} -> ${details.targetAgreementNumber}`,
        notes: details.reason || 'Vehicle reassignment',
        status: 'pending_review' as any,
        created_at: reassignedAt,
        updated_at: reassignedAt,
        // Store reassignment details in the notes field
        additional_data: {
          source_agreement_id: details.sourceAgreementId, 
          source_agreement_number: details.sourceAgreementNumber,
          target_agreement_id: details.targetAgreementId,
          target_agreement_number: details.targetAgreementNumber,
          reassigned_by: details.userId,
          transfer_obligations: details.transferObligations
        }
      })
      .select('id')
      .single();
      
    if (error) {
      console.error("Error recording vehicle reassignment:", error);
      return null;
    }
    
    // Also add an entry to the audit logs for this action
    await supabase
      .from('audit_logs')
      .insert({
        entity_type: 'vehicle',
        entity_id: details.vehicleId,
        action: 'reassign',
        performed_by: details.userId,
        description: `Vehicle reassigned from agreement #${details.sourceAgreementNumber} to agreement #${details.targetAgreementNumber}`,
        changes: {
          source_agreement_id: details.sourceAgreementId,
          target_agreement_id: details.targetAgreementId,
          reason: details.reason
        }
      });
    
    return data?.id || null;
  } catch (error) {
    console.error("Unexpected error in recordVehicleReassignment:", error);
    return null;
  }
};

/**
 * Transfers financial obligations from one agreement to another
 * @param sourceAgreementId The source agreement ID
 * @param targetAgreementId The target agreement ID
 * @returns Promise resolving to success status
 */
export const transferObligations = async (
  sourceAgreementId: string,
  targetAgreementId: string
): Promise<boolean> => {
  try {
    // 1. Transfer any pending payments
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .update({ lease_id: targetAgreementId })
      .eq('lease_id', sourceAgreementId)
      .in('status', ['pending', 'overdue'])
      .select('id');
      
    if (paymentsError) {
      console.error("Error transferring payments:", paymentsError);
      toast.error("Failed to transfer payments between agreements");
      return false;
    }
    
    // 2. Transfer any pending traffic fines
    const { data: fines, error: finesError } = await supabase
      .from('traffic_fines')
      .update({ lease_id: targetAgreementId })
      .eq('lease_id', sourceAgreementId)
      .eq('payment_status', 'pending')
      .select('id');
      
    if (finesError) {
      console.error("Error transferring traffic fines:", finesError);
      toast.error("Failed to transfer traffic fines between agreements");
      return false;
    }
    
    const transferCount = (payments?.length || 0) + (fines?.length || 0);
    
    if (transferCount > 0) {
      toast.success(`Successfully transferred ${transferCount} financial obligations`);
    }
    
    return true;
  } catch (error) {
    console.error("Unexpected error in transferObligations:", error);
    toast.error("An unexpected error occurred during obligation transfer");
    return false;
  }
};

/**
 * Reverts a vehicle reassignment, returning the vehicle to its original agreement
 * @param reassignmentId The ID of the reassignment to revert
 * @param reason The reason for reverting
 * @returns Promise resolving to success status
 */
export const revertReassignment = async (
  reassignmentId: string,
  reason: string = "User-initiated rollback"
): Promise<boolean> => {
  try {
    // 1. Fetch the reassignment record from leases table
    const { data, error } = await supabase
      .from('leases')
      .select('*, additional_data')
      .eq('id', reassignmentId)
      .single();
      
    if (error || !data) {
      console.error("Error fetching reassignment record:", error);
      toast.error("Failed to find reassignment record");
      return false;
    }
    
    // Check if we have the required additional_data
    const additionalData = data.additional_data || {};
    const sourceAgreementId = additionalData.source_agreement_id;
    const sourceAgreementNumber = additionalData.source_agreement_number;
    const targetAgreementId = additionalData.target_agreement_id;
    const targetAgreementNumber = additionalData.target_agreement_number;
    const vehicleId = data.vehicle_id;
    
    if (!sourceAgreementId || !targetAgreementId) {
      toast.error("Incomplete reassignment data found - cannot revert");
      return false;
    }
    
    // 2. Check if the source agreement is still valid for rollback
    const { data: sourceAgreement, error: sourceError } = await supabase
      .from('leases')
      .select('id, status')
      .eq('id', sourceAgreementId)
      .single();
      
    if (sourceError || !sourceAgreement) {
      toast.error("Original agreement no longer exists or is inaccessible");
      return false;
    }
    
    // 3. Check if the target agreement still has the vehicle
    const { data: targetAgreement, error: targetError } = await supabase
      .from('leases')
      .select('id, vehicle_id')
      .eq('id', targetAgreementId)
      .single();
      
    if (targetError || !targetAgreement || targetAgreement.vehicle_id !== vehicleId) {
      toast.error("Vehicle is no longer assigned to the target agreement");
      return false;
    }
    
    // 4. Perform the rollback - move vehicle back to source agreement
    const { error: updateError } = await supabase
      .from('leases')
      .update({ 
        vehicle_id: vehicleId,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', sourceAgreementId);
      
    if (updateError) {
      console.error("Error updating source agreement:", updateError);
      toast.error("Failed to reassign vehicle back to original agreement");
      return false;
    }
    
    // 5. Remove vehicle from target agreement
    const { error: targetUpdateError } = await supabase
      .from('leases')
      .update({ 
        vehicle_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetAgreementId);
      
    if (targetUpdateError) {
      console.error("Error updating target agreement:", targetUpdateError);
      toast.error("Failed to remove vehicle from new agreement");
      // We don't return false here, as the main operation succeeded
    }
    
    // 6. If original reassignment transferred obligations, move them back
    if (additionalData.transfer_obligations) {
      await transferObligations(targetAgreementId, sourceAgreementId);
    }
    
    // 7. Record the rollback action
    await recordVehicleReassignment({
      sourceAgreementId: targetAgreementId,
      sourceAgreementNumber: targetAgreementNumber,
      targetAgreementId: sourceAgreementId,
      targetAgreementNumber: sourceAgreementNumber,
      vehicleId: vehicleId,
      reason: reason
    });
    
    toast.success("Vehicle successfully returned to original agreement");
    return true;
  } catch (error) {
    console.error("Unexpected error in revertReassignment:", error);
    toast.error("An unexpected error occurred during rollback");
    return false;
  }
};

/**
 * Fetch reassignment history for a specific vehicle or agreement
 * @param params Search parameters (either vehicleId or agreementId must be provided)
 * @returns Array of reassignment records
 */
export const getReassignmentHistory = async (params: {
  vehicleId?: string;
  agreementId?: string;
  limit?: number;
}): Promise<any[]> => {
  try {
    if (!params.vehicleId && !params.agreementId) {
      console.error("Either vehicleId or agreementId must be provided");
      return [];
    }
    
    // We'll use the audit_logs table to get reassignment history since there is no vehicle_reassignments table
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        entity_id, 
        action,
        performed_by,
        created_at,
        description,
        changes
      `)
      .eq('action', 'reassign')
      .eq('entity_type', 'vehicle')
      .order('created_at', { ascending: false });
      
    if (params.vehicleId) {
      query = query.eq('entity_id', params.vehicleId);
    }
    
    if (params.agreementId) {
      // We need to search inside the changes JSON field
      query = query.or(
        `changes->source_agreement_id.eq.${params.agreementId},changes->target_agreement_id.eq.${params.agreementId}`
      );
    }
    
    if (params.limit) {
      query = query.limit(params.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching reassignment history:", error);
      return [];
    }
    
    // Transform the data to match the expected format
    const transformedData = data?.map(item => ({
      id: item.id,
      source_agreement_id: item.changes?.source_agreement_id,
      target_agreement_id: item.changes?.target_agreement_id,
      vehicle_id: item.entity_id,
      reassigned_at: item.created_at,
      reassigned_by: item.performed_by,
      reason: item.changes?.reason,
      description: item.description
    })) || [];
    
    return transformedData;
  } catch (error) {
    console.error("Unexpected error in getReassignmentHistory:", error);
    return [];
  }
};
