
import { z } from 'zod';

export const reconcilePaymentSchema = z.object({
  amount: z.number().min(1, { message: "Amount must be at least 1" }),
  paymentDate: z.date({
    required_error: "A payment date is required.",
  }),
  paymentMethod: z.string().min(1, { message: "Payment method is required" }),
  description: z.string().optional()
});

export type ReconcilePaymentInput = z.infer<typeof reconcilePaymentSchema>;

export const paymentSchema = z.object({
  id: z.string().optional(),
  lease_id: z.string(),
  amount: z.number().min(0),
  amount_paid: z.number().optional().default(0),
  payment_date: z.string().nullable().optional(),
  payment_method: z.string().optional(),
  status: z.string(),
  type: z.string().optional(),
  description: z.string().optional(),
  transaction_id: z.string().optional(),
  original_due_date: z.string().nullable().optional(),
  days_overdue: z.number().optional(),
  late_fine_amount: z.number().optional(),
  daily_late_fee: z.number().optional()
});

export type PaymentInput = z.infer<typeof paymentSchema>;
