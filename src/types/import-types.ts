
/**
 * Type definitions for import features
 */

export interface ImportHistoryItem {
  id: string;
  file_name: string;
  status: ImportStatus;
  total_records: number;
  processed_records: number;
  failed_records: number;
  created_at: string;
}

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImportProgress {
  processedCount: number;
  totalCount: number;
  errorCount: number;
  percentComplete: number;
}

export interface ImportError {
  row: number;
  column?: string;
  message: string;
  value?: unknown;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  createdAt: string;
  status: ImportStatus;
  createdBy?: string;
  originalFileName?: string;
}

export interface ImportMapping {
  id: string;
  name: string;
  fieldMappings: Record<string, string>;
  isActive: boolean;
}
