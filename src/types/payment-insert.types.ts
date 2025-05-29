
import { Payment } from './payment.types';

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
