
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { hasData, hasProperty } from '@/utils/database-type-helpers';

export const useTrafficFinesValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  
  // Function to validate a traffic fine
  const validateTrafficFine = async (fineId: string, licensePlate: string) => {
    setIsValidating(true);
    
    try {
      // Create validation record
      const response = await supabase
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
        
      if (response.error) {
        console.error("Error creating validation record:", response.error);
        toast.error("Failed to create validation record");
        return false;
      }
      
      // Safely check if we have valid data
      if (!response.data) {
        console.error("No validation record data returned");
        toast.error("Failed to create validation record - no data returned");
        return false;
      }
      
      const validationRecord = response.data;
      
      // Update traffic fine with validation result
      const validationData = {
        validation_status: 'completed',
        validation_date: validationRecord.validation_date,
        validation_result: validationRecord.result,
        last_check_date: new Date().toISOString()
      };
      
      const updateResponse = await supabase
        .from('traffic_fines')
        .update(validationData)
        .eq('id', fineId);
        
      if (updateResponse.error) {
        console.error("Error updating traffic fine:", updateResponse.error);
        toast.error("Failed to update traffic fine with validation result");
        return false;
      }
      
      toast.success("Traffic fine validated successfully");
      return true;
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
