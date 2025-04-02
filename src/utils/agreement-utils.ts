import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';

// Helper function to adapt SimpleAgreement to Agreement type for detail pages
export const adaptSimpleToFullAgreement = (simpleAgreement: SimpleAgreement): Agreement => {
  return {
    ...simpleAgreement,
    id: simpleAgreement.id,
    customer_id: simpleAgreement.customer_id,
    vehicle_id: simpleAgreement.vehicle_id,
    start_date: simpleAgreement.start_date ? new Date(simpleAgreement.start_date) : new Date(),
    end_date: simpleAgreement.end_date ? new Date(simpleAgreement.end_date) : new Date(),
    status: simpleAgreement.status as AgreementStatus,
    created_at: simpleAgreement.created_at ? new Date(simpleAgreement.created_at) : undefined,
    updated_at: simpleAgreement.updated_at ? new Date(simpleAgreement.updated_at) : undefined,
    total_amount: simpleAgreement.total_amount || 0,
    deposit_amount: simpleAgreement.deposit_amount || 0,
    agreement_number: simpleAgreement.agreement_number || '',
    notes: simpleAgreement.notes || '',
    terms_accepted: true,
    additional_drivers: [],
  };
};

export const updateAgreementWithCheck = async (
  params: { id: string; data: any },
  userId: string | undefined, 
  onSuccess: () => void,
  onError: (error: any) => void
) => {
  try {
    if (!userId) {
      console.warn("User ID is not available. Proceeding without user-specific checks.");
    }

    // Optimistic update
    toast.success("Agreement update initiated...");

    const { data, error } = await supabase
      .from('leases')
      .update(params.data)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error("Update failed:", error);
      toast.error(`Update failed: ${error.message}`);
      onError(error);
    } else {
      console.log("Agreement updated successfully:", data);
      toast.success("Agreement updated successfully!");
      onSuccess();
    }
  } catch (error) {
    console.error("Unexpected error during update:", error);
    toast.error("An unexpected error occurred during the update.");
    onError(error);
  }
};
