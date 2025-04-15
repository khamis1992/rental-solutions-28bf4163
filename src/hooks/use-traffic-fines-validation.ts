
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { hasData } from '@/utils/database-type-helpers';

export const useTrafficFinesValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  
  // Function to validate a traffic fine
  const validateTrafficFine = async (fineId: string, licensePlate: string) => {
    setIsValidating(true);
    
    try {
      // Create validation record
      const { data: validationRecord, error: validationError } = await supabase
        .from('traffic_fine_validations')
        .insert({
          fine_id: fineId,
          license_plate: licensePlate,
          validation_source: 'manual',
          result: {
            status: 'validated',
            message: 'Manual validation performed',
            validation_date: new Date().toISOString()
          }
        })
        .select()
        .single();
      
      if (validationError) {
        console.error("Error creating validation record:", validationError);
        toast.error("Failed to create validation record");
        return false;
      }
      
      // Update traffic fine with validation result
      if (hasData({ data: validationRecord, error: null })) {
        const validationData = {
          validation_status: 'completed',
          validation_date: validationRecord.validation_date,
          validation_result: validationRecord.result,
          last_check_date: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('traffic_fines')
          .update(validationData)
          .eq('id', fineId as any);
          
        if (updateError) {
          console.error("Error updating traffic fine:", updateError);
          toast.error("Failed to update traffic fine with validation result");
          return false;
        }
        
        toast.success("Traffic fine validated successfully");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Unexpected error in validateTrafficFine:", error);
      toast.error("An unexpected error occurred during validation");
      return false;
    } finally {
      setIsValidating(false);
    }
  };
  
  return {
    isValidating,
    validateTrafficFine
  };
};
