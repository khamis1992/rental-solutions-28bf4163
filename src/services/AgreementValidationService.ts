
import { z } from "zod";
import { agreementSchema } from "@/lib/validation-schemas/agreement";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { safeAsync } from "@/utils/error-handling";

// Extended validation result with field-specific errors
export interface ValidationResult {
  success: boolean;
  errors: {
    fieldErrors: Record<string, string[]>;
    generalErrors: string[];
  };
  validatedData?: z.infer<typeof agreementSchema>;
}

// Agreement validation service
export class AgreementValidationService {
  /**
   * Validates agreement data against schema and business rules
   */
  public static async validateAgreement(data: any): Promise<ValidationResult> {
    try {
      // Step 1: Schema validation
      const schemaValidation = agreementSchema.safeParse(data);
      
      if (!schemaValidation.success) {
        const formattedErrors = this.formatZodErrors(schemaValidation.error);
        return {
          success: false,
          errors: formattedErrors
        };
      }
      
      // Step 2: Business rule validation
      const businessRuleValidation = await this.validateBusinessRules(schemaValidation.data);
      
      if (!businessRuleValidation.success) {
        return businessRuleValidation;
      }
      
      // All validations passed
      return {
        success: true,
        errors: { fieldErrors: {}, generalErrors: [] },
        validatedData: schemaValidation.data
      };
      
    } catch (error) {
      console.error("Agreement validation error:", error);
      return {
        success: false,
        errors: {
          fieldErrors: {},
          generalErrors: ["Unexpected error during validation"]
        }
      };
    }
  }
  
  /**
   * Format Zod errors into field-specific errors
   */
  private static formatZodErrors(error: z.ZodError): { fieldErrors: Record<string, string[]>, generalErrors: string[] } {
    const fieldErrors: Record<string, string[]> = {};
    const generalErrors: string[] = [];
    
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (path) {
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(err.message);
      } else {
        generalErrors.push(err.message);
      }
    });
    
    return { fieldErrors, generalErrors };
  }
  
  /**
   * Validate business rules that go beyond schema validation
   */
  private static async validateBusinessRules(data: z.infer<typeof agreementSchema>): Promise<ValidationResult> {
    const errors: { fieldErrors: Record<string, string[]>, generalErrors: string[] } = {
      fieldErrors: {},
      generalErrors: []
    };
    
    // Check if start date is in the past
    if (data.start_date < new Date(new Date().setHours(0, 0, 0, 0))) {
      if (!errors.fieldErrors['start_date']) {
        errors.fieldErrors['start_date'] = [];
      }
      errors.fieldErrors['start_date'].push("Start date cannot be in the past");
    }
    
    // Check if end date is before start date
    if (data.end_date < data.start_date) {
      if (!errors.fieldErrors['end_date']) {
        errors.fieldErrors['end_date'] = [];
      }
      errors.fieldErrors['end_date'].push("End date must be after start date");
    }
    
    // Check if customer exists
    const { data: customerExists, error: customerError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.customer_id)
      .single();
      
    if (customerError || !customerExists) {
      if (!errors.fieldErrors['customer_id']) {
        errors.fieldErrors['customer_id'] = [];
      }
      errors.fieldErrors['customer_id'].push("Selected customer does not exist");
    }
    
    // Check if vehicle exists
    const { data: vehicleExists, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", data.vehicle_id)
      .single();
      
    if (vehicleError || !vehicleExists) {
      if (!errors.fieldErrors['vehicle_id']) {
        errors.fieldErrors['vehicle_id'] = [];
      }
      errors.fieldErrors['vehicle_id'].push("Selected vehicle does not exist");
    }
    
    // Check if we have any errors
    const hasErrors = Object.keys(errors.fieldErrors).length > 0 || errors.generalErrors.length > 0;
    
    return {
      success: !hasErrors,
      errors,
      validatedData: hasErrors ? undefined : data
    };
  }
}

// Utility function to apply validation results to form errors
export function applyValidationResultToForm(
  result: ValidationResult, 
  setError: (field: string, error: { message: string }) => void
): void {
  // Clear previous errors
  
  // Set field errors
  Object.entries(result.errors.fieldErrors).forEach(([field, messages]) => {
    if (messages.length > 0) {
      setError(field, { 
        message: messages.join(", ") 
      });
    }
  });
  
  // Show general errors as toasts
  result.errors.generalErrors.forEach(message => {
    toast.error(message);
  });
}
