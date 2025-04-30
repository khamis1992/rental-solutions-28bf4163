
export interface ImportHistoryItem {
  id: string;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
  file_name: string;
  total_records?: number;
  processed_records?: number;
  failed_records?: number;
}

export interface ImportData {
  id: string;
  status: string;
  file_name: string;
  processed_count: number;
  error_count: number;
  row_count: number;
  created_at: string;
}

export interface ImportFilter {
  status?: string[];
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export interface ImportErrorItem {
  id: string;
  import_log_id: string;
  row_number: number;
  error_message: string;
  row_data: Record<string, any>;
  created_at: string;
}
