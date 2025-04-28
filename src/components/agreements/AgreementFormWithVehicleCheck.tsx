
import { useState, useEffect } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { checkVehicleAvailability } from '@/utils/agreement-utils';
import { VehicleAssignmentDialog } from './VehicleAssignmentDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { castLeaseStatus, castLeaseUpdate, asLeaseId } from '@/utils/database-type-helpers';
import { Database } from '@/types/database.types';

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
    if (!formData.vehicle_id || !formData.start_date || !formData.end_date) {
      return;
    }
    
    setIsChecking(true);
    
    try {
      const result = await checkVehicleAvailability(
        formData.vehicle_id,
        new Date(formData.start_date),
        new Date(formData.end_date),
        formData.id
      );
      
      if (result.available) {
        onValidationComplete(true);
      } else if (result.conflictingAgreements && result.conflictingAgreements.length > 0) {
        const conflictingAgreement = result.conflictingAgreements[0];
        setExistingAgreement({
          id: conflictingAgreement.id,
          agreement_number: conflictingAgreement.agreement_number
        });
        setIsDialogOpen(true);
      } else {
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
      // Create update object with proper typing
      const leaseUpdate = castLeaseUpdate({ 
        status: castLeaseStatus('terminated')
      });
      
      // Convert ID to the correct type for querying
      const typedLeaseId = asLeaseId(existingAgreement.id);
      
      const { error } = await supabase
        .from('leases')
        .update(leaseUpdate)
        .eq('id', typedLeaseId);
      
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

export default AgreementFormWithVehicleCheck;
