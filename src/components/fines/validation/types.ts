
// Define consistent validation result types to be used across components
export interface ValidationResultType {
  isValid: boolean;
  message: string;
  licensePlate?: string;
  validationDate?: Date;
  validationSource?: string;
  hasFine?: boolean;
  details?: string;
  validationId?: string;
}

export interface ValidationHistoryItem {
  id: string;
  licensePlate: string;
  validationDate: Date;
  validationSource: string;
  hasFine: boolean;
  details?: string;
}
