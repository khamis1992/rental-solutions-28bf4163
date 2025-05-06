
import { Database } from './database.types';

export type AgreementImport = Database['public']['Tables']['agreement_imports']['Row'];
export type AgreementImportInsert = Database['public']['Tables']['agreement_imports']['Insert'];
export type AgreementImportUpdate = Database['public']['Tables']['agreement_imports']['Update'];

export interface ImportHistoryItem {
  id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name: string;
  total_records?: number;
  processed_records?: number;
  failed_records?: number;
  error_message?: string;
  original_file_name?: string;
  row_count?: number;
  error_count?: number;
}

export function mapImportRecordToHistoryItem(record: any): ImportHistoryItem {
  return {
    id: record.id,
    created_at: record.created_at,
    status: record.status,
    file_name: record.file_name,
    original_file_name: record.original_file_name,
    total_records: record.row_count,
    processed_records: record.processed_count,
    failed_records: record.error_count,
    error_message: record.errors ? JSON.stringify(record.errors) : undefined
  };
}
