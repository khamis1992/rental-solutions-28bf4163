
import type { Database } from '@/types/database.types';
import { Agreement, Payment, ImportHistoryItem } from '@/types/domain/models';
import { DbId } from '@/types/database-common';

type DbLease = Database['public']['Tables']['leases']['Row'];
type DbPayment = Database['public']['Tables']['unified_payments']['Row'];
type DbImport = Database['public']['Tables']['agreement_imports']['Row'];

export function mapDbToAgreement(dbLease: DbLease): Agreement {
  return {
    ...dbLease,
    payment_frequency: dbLease.payment_frequency || 'monthly',
    payment_day: dbLease.rent_due_day || 1,
  };
}

export function mapDbToPayment(dbPayment: DbPayment): Payment {
  return {
    id: dbPayment.id,
    lease_id: dbPayment.lease_id as DbId,
    amount: dbPayment.amount,
    amount_paid: dbPayment.amount_paid,
    balance: dbPayment.balance,
    payment_date: dbPayment.payment_date,
    payment_method: dbPayment.payment_method,
    status: dbPayment.status,
    description: dbPayment.description,
    type: dbPayment.type,
    late_fine_amount: dbPayment.late_fine_amount,
    days_overdue: dbPayment.days_overdue,
    original_due_date: dbPayment.original_due_date,
    created_at: dbPayment.created_at,
    updated_at: dbPayment.updated_at
  };
}

export function mapDbToImportHistory(dbImport: DbImport): ImportHistoryItem {
  return {
    id: dbImport.id,
    file_name: dbImport.file_name,
    status: dbImport.status,
    error_count: dbImport.error_count,
    processed_count: dbImport.processed_count,
    row_count: dbImport.row_count,
    created_at: dbImport.created_at,
    updated_at: dbImport.updated_at
  };
}
