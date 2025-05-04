
/**
 * Types for traffic fine validation functionality
 */

export interface ValidationResult {
  licensePlate: string;
  isValid: boolean;
  message: string;
  validationDate?: Date;
  validationSource?: string;
  hasFine?: boolean;
  details?: string;
  validationId?: string;
  environment?: string;
}

export interface ApiValidationResult {
  licensePlate: string;
  validationDate: Date;
  validationSource: string;
  hasFine: boolean;
  details?: string;
  validationId?: string;
}

export interface PendingStatusUpdate {
  id: string;
  licensePlate: string;
  validationResult: ApiValidationResult;
  timestamp: Date;
}

export interface ValidationError {
  code: string;
  message: string;
  licensePlate: string;
  timestamp: Date;
  details?: any;
}

export interface BatchValidationOptions {
  batchSize?: number;
  concurrency?: number;
  continueOnError?: boolean;
}

export interface ValidationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentComplete: number;
}

export interface BatchValidationResult {
  results: ApiValidationResult[];
  errors: ValidationError[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  }
}

export interface ConfirmStatusUpdateProps {
  id: string;
}

export interface BasicMutationResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  message?: string;
}
