
import { Database } from './database.types';

export type Agreement = Database['public']['Tables']['leases']['Row'];
export type AgreementStatus = Database['public']['Tables']['leases']['Row']['status'];

export interface TableFilters {
  status?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface BulkAction {
  selectedIds: string[];
  action: 'delete' | 'update';
}
