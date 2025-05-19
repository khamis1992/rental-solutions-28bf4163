import { z } from 'zod';
import { PaymentStatus } from '@/types/payment.types';

export const paymentStatusEnum = z.enum([
  'pending',
  'completed',
  'overdue',
  'cancelled',
  'partially_paid',
  'voided',
  'failed',
  'refunded'
]);

export const paymentSchema = z.object({
  lease_id: z.string().min(1, 'Agreement is required'),
  amount: z.number().positive('Amount must be positive'),
  amount_paid: z.number().nonnegative().optional(),
  balance: z.number().nonnegative().optional(),
  payment_date: z.string().or(z.date()).optional(),
  due_date: z.string().or(z.date()).optional(),
  status: paymentStatusEnum.default('completed'),
  payment_method: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  late_fine_amount: z.number().nonnegative().optional(),
  days_overdue: z.number().nonnegative().optional(),
  original_due_date: z.string().or(z.date()).optional(),
  reference_number: z.string().optional()
});

export type PaymentSchemaType = z.infer<typeof paymentSchema>;
