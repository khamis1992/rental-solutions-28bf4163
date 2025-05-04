
import { Database } from './database.types';

export type PaymentRow = Database['public']['Tables']['unified_payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['unified_payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['unified_payments']['Update'];
export type PaymentStatus = string;

export interface PaymentMetrics {
  sent: number;
  opened: number;
  clicked: number;
  delivered: number;
  conversion: number;
}
