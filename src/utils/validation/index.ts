
/**
 * Central export for all validation utility functions
 * Import validation functions from this file instead of individual validators
 */

// Re-export all validators
export * from './basic-validators';
export * from './type-validators';
export * from './payment-validators';
export * from './user-input-validators';
export * from './file-validators';
export * from './geo-validators';
export * from './date-validators';
export * from './array-validators';

// Create a validator object for easy access to all validation functions
import * as basicValidators from './basic-validators';
import * as typeValidators from './type-validators';
import * as paymentValidators from './payment-validators';
import * as userInputValidators from './user-input-validators';
import * as fileValidators from './file-validators';
import * as geoValidators from './geo-validators';
import * as dateValidators from './date-validators';
import * as arrayValidators from './array-validators';

// Combined validators object
export const validators = {
  ...basicValidators,
  ...typeValidators,
  ...paymentValidators,
  ...userInputValidators,
  ...fileValidators,
  ...geoValidators,
  ...dateValidators,
  ...arrayValidators
};

// Legacy export (deprecated, use direct imports instead)
export { validators as dataValidation };
