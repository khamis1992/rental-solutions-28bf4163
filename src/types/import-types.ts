
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
}
