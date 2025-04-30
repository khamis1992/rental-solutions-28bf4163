import { supabase } from '@/integrations/supabase/client';
import { validateAgreementForm } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';

/**
 * Creates a new agreement after validating the input data
 * @param agreementData - The agreement data from the form
 * @returns Object containing the result of the operation
 */
export async function createAgreement(agreementData: unknown) {
  // Step 1: Validate the form data
  const validationResult = validateAgreementForm(agreementData);
  
  // If validation fails, return the errors
  if (!validationResult.success) {
    return {
      success: false,
      data: null,
      errors: validationResult.errors
    };
  }
  
  try {
    // Step 2: Insert the validated data into Supabase
    const { data, error } = await supabase
      .from('leases')
      .insert(validationResult.data)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating agreement:', error);
      return {
        success: false,
        data: null,
        errors: { _form: error.message }
      };
    }
    
    // Step 3: Return success with the created agreement
    return {
      success: true,
      data,
      errors: null
    };
  } catch (error) {
    console.error('Unexpected error creating agreement:', error);
    return {
      success: false,
      data: null,
      errors: { _form: 'An unexpected error occurred while creating the agreement' }
    };
  }
}

/**
 * Displays appropriate messages to the user based on the operation result
 * @param result - The result of the createAgreement operation
 */
export function handleAgreementResult(result: { 
  success: boolean; 
  data: any; 
  errors: Record<string, string> | null;
}) {
  if (result.success) {
    toast.success('Agreement created successfully');
    return true;
  } else {
    // Display specific form errors or a general error message
    if (result.errors?._form) {
      toast.error(result.errors._form);
    } else if (result.errors) {
      toast.error('Please fix the form errors and try again');
    } else {
      toast.error('Failed to create agreement');
    }
    return false;
  }
}
