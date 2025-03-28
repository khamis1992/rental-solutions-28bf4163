
/**
 * Data validation utilities for ensuring data integrity across the application
 */

// Generic validation function for required fields
export const validateRequiredFields = <T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[],
  entityName: string = 'record'
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  requiredFields.forEach(field => {
    const value = data[field];
    
    if (value === undefined || value === null || value === '') {
      errors.push(`Missing required field: ${String(field)}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate date fields to ensure they are valid dates
export const validateDateFields = <T extends Record<string, any>>(
  data: T,
  dateFields: (keyof T)[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  dateFields.forEach(field => {
    const value = data[field];
    
    if (value !== undefined && value !== null) {
      // Check if it's already a Date object
      if (value instanceof Date) {
        if (isNaN(value.getTime())) {
          errors.push(`Invalid date for field: ${String(field)}`);
        }
      } 
      // Check if it's a string that can be converted to a valid date
      else if (typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`Invalid date string for field: ${String(field)}`);
        }
      } else {
        errors.push(`Field ${String(field)} is not a valid date or date string`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate numeric fields
export const validateNumericFields = <T extends Record<string, any>>(
  data: T,
  numericFields: (keyof T)[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  numericFields.forEach(field => {
    const value = data[field];
    
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`Field ${String(field)} must be a valid number`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate relationships exist in the database
export const validateRelationships = async (
  entityType: string,
  relationships: Array<{ field: string; value: string; table: string; column?: string }>
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  // This function would integrate with your database client (e.g., Supabase)
  // to check if referenced records exist
  
  // Example implementation (pseudo-code):
  // for (const rel of relationships) {
  //   const { data, error } = await supabase
  //     .from(rel.table)
  //     .select('id')
  //     .eq(rel.column || 'id', rel.value)
  //     .single();
  //     
  //   if (error || !data) {
  //     errors.push(`${entityType} references non-existent ${rel.table} with ${rel.field}=${rel.value}`);
  //   }
  // }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Comprehensive validator for traffic fines
export const validateTrafficFine = (fine: any): { isValid: boolean; errors: string[] } => {
  const requiredFields = ['id', 'violationNumber', 'fineAmount', 'paymentStatus'];
  const dateFields = ['violationDate', 'paymentDate'];
  const numericFields = ['fineAmount'];
  
  // Validate required fields
  const requiredValidation = validateRequiredFields(fine, requiredFields, 'Traffic Fine');
  
  // Validate date fields
  const dateValidation = validateDateFields(fine, dateFields);
  
  // Validate numeric fields
  const numericValidation = validateNumericFields(fine, numericFields);
  
  // Combine all validation results
  const allErrors = [
    ...requiredValidation.errors,
    ...dateValidation.errors,
    ...numericValidation.errors
  ];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Comprehensive validator for vehicles
export const validateVehicle = (vehicle: any): { isValid: boolean; errors: string[] } => {
  const requiredFields = ['id', 'make', 'model', 'year', 'license_plate', 'vin', 'status'];
  const numericFields = ['year', 'mileage'];
  
  // Validate required fields
  const requiredValidation = validateRequiredFields(vehicle, requiredFields, 'Vehicle');
  
  // Validate numeric fields
  const numericValidation = validateNumericFields(vehicle, numericFields);
  
  // Additional vehicle-specific validations
  const specificErrors: string[] = [];
  
  // VIN validation (basic check for length)
  if (vehicle.vin && (typeof vehicle.vin !== 'string' || vehicle.vin.length !== 17)) {
    specificErrors.push('VIN must be a 17-character string');
  }
  
  // Year validation
  const currentYear = new Date().getFullYear();
  if (vehicle.year && (vehicle.year < 1900 || vehicle.year > currentYear + 1)) {
    specificErrors.push(`Vehicle year must be between 1900 and ${currentYear + 1}`);
  }
  
  // Combine all validation results
  const allErrors = [
    ...requiredValidation.errors,
    ...numericValidation.errors,
    ...specificErrors
  ];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Comprehensive validator for maintenance records
export const validateMaintenance = (maintenance: any): { isValid: boolean; errors: string[] } => {
  const requiredFields = ['id', 'vehicle_id', 'maintenance_type', 'status', 'scheduled_date'];
  const dateFields = ['scheduled_date', 'completed_date'];
  const numericFields = ['cost'];
  
  // Validate required fields
  const requiredValidation = validateRequiredFields(maintenance, requiredFields, 'Maintenance');
  
  // Validate date fields
  const dateValidation = validateDateFields(maintenance, dateFields);
  
  // Validate numeric fields
  const numericValidation = validateNumericFields(maintenance, numericFields);
  
  // Additional maintenance-specific validations
  const specificErrors: string[] = [];
  
  // If maintenance is completed, completed_date should be provided
  if (maintenance.status === 'completed' && !maintenance.completed_date) {
    specificErrors.push('Completed maintenance must have a completion date');
  }
  
  // Combine all validation results
  const allErrors = [
    ...requiredValidation.errors,
    ...dateValidation.errors,
    ...numericValidation.errors,
    ...specificErrors
  ];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};
