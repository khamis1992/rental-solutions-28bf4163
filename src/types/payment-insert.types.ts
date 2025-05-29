
import { Payment } from './payment.types';

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'> & {
  status?: Payment['status']; // Make status optional for inserts
};
