
export interface ValidationResult {
  id?: string;
  licensePlate: string;
  isValid: boolean;
  message: string;
  details?: any;
  timestamp?: Date;
  validationDate?: Date;
  validationSource?: string;
  hasFine?: boolean;
  validationId?: string;
  environment?: string;
}

export type ValidationResultType = ValidationResult;
