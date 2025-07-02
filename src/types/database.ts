// Re-export database types from Supabase integration
export * from '@/integrations/supabase/types';

// Type aliases for commonly used types
import type { Database } from '@/integrations/supabase/types';

export type Agreement = Database['public']['Tables']['leases']['Row'];
export type Customer = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type UnifiedPayment = Database['public']['Tables']['unified_payments']['Row'];
export type PaymentRecord = UnifiedPayment;

// Additional database helper types
export type DatabaseError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

export type QueryResult<T> = {
  data: T | null;
  error: DatabaseError | null;
  count?: number | null;
};