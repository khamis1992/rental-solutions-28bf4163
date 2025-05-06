
export interface ImportHistoryItem {
  id: string;
  file_name: string;
  status: string;
  total_records?: number;
  processed_records?: number;
  failed_records?: number;
  created_at: string;
  original_file_name?: string;
  error_count?: number;
  created_by?: string;
  batch_id?: string;
}
