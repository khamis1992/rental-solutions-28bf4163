
import { useState, useEffect } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { checkVehicleAvailability } from '@/utils/agreement-utils';
import { VehicleAssignmentDialog } from './VehicleAssignmentDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AgreementFormWithVehicleCheckProps {
  children: React.ReactNode;
  formData: Agreement;
  onValidationComplete: (isValid: boolean, existingAgreement?: { id: string; agreement_number: string }) => void;
}

export function AgreementFormWithVehicleCheck({
  children,
  formData,
  onValidationComplete
}: AgreementFormWithVehicleCheckProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [existingAgreement, setExistingAgreement] = useState<{id: string; agreement_number: string} | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const checkAvailability = async () => {
    // Return early if we don't have enough data
    if (!formData.vehicle_id || !formData.start_date || !formData.end_date) {
      return;
    }
    
    setIsChecking(true);
    
    try {
      // Check if vehicle is available for the selected period
      const result = await checkVehicleAvailability(
        formData.vehicle_id,
        new Date(formData.start_date),
        new Date(formData.end_date),
        formData.id
      );
      
      if (result.available) {
        // Vehicle is available, let parent component know validation passed
        onValidationComplete(true);
      } else if (result.conflictingAgreements && result.conflictingAgreements.length > 0) {
        // Vehicle is not available, show dialog with existing agreement
        const conflictingAgreement = result.conflictingAgreements[0];
        setExistingAgreement({
          id: conflictingAgreement.id,
          agreement_number: conflictingAgreement.agreement_number
        });
        setIsDialogOpen(true);
        // Don't call onValidationComplete yet - wait for user decision
      } else {
        // Generic error, let parent component know validation failed
        toast.error(result.message || "Vehicle is not available for selected dates");
        onValidationComplete(false);
      }
    } catch (error) {
      console.error("Error checking vehicle availability:", error);
      toast.error("Failed to check vehicle availability");
      onValidationComplete(false);
    } finally {
      setIsChecking(false);
    }
  };
  
  useEffect(() => {
    checkAvailability();
  }, [formData.vehicle_id, formData.start_date, formData.end_date]);
  
  const handleConfirmAssignment = async () => {
    if (!existingAgreement) return;
    
    try {
      // Update existing agreement to terminated status
      const { error } = await supabase
        .from('leases')
        .update({ status: 'terminated' })
        .eq('id', existingAgreement.id);
      
      if (error) {
        throw error;
      }
      
      toast.success(`Agreement ${existingAgreement.agreement_number} has been terminated`);
      onValidationComplete(true);
    } catch (error) {
      console.error("Error terminating existing agreement:", error);
      toast.error("Failed to terminate existing agreement");
      onValidationComplete(false);
    } finally {
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      {children}
      
      {existingAgreement && (
        <VehicleAssignmentDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            onValidationComplete(false);
          }}
          onConfirm={handleConfirmAssignment}
          vehicleId={formData.vehicle_id}
          existingAgreement={existingAgreement}
        />
      )}
    </>
  );
}
