/**
 * Zod schemas for payment data validation
 */
import { z } from 'zod';

/**
 * Payment status schema
 */
export const paymentStatusSchema = z.enum([
  'pending', 
  'completed', 
  'overdue', 
  'cancelled', 
  'partially_paid', 
  'voided'
]);

/**
 * Payment schema for validation
 */
export const paymentSchema = z.object({
  id: z.string().optional(),
  lease_id: z.string(),
  amount: z.number().positive(),
  payment_date: z.string().optional(),
  description: z.string().optional(),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  status: paymentStatusSchema,
  type: z.string().optional(),
  days_overdue: z.number().int().nonnegative().optional(),
  late_fine_amount: z.number().nonnegative().optional(),
  due_date: z.string().optional(),
  original_due_date: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  amount_paid: z.number().nonnegative().optional(),
  balance: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  transaction_id: z.string().optional(),
  next_payment_date: z.string().nullable().optional()
});

/**
 * Payment insert schema for validation
 */
export const paymentInsertSchema = paymentSchema.omit({ id: true });

/**
 * Payment update schema for validation
 */
export const paymentUpdateSchema = paymentSchema.partial();

/**
 * Special payment options schema
 */
export const specialPaymentOptionsSchema = z.object({
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  includeLatePaymentFee: z.boolean().optional(),
  isPartialPayment: z.boolean().optional(),
  paymentType: z.string().optional(),
  targetPaymentId: z.string().optional()
});

/**
 * Payment creation schema with validation
 */
export const createPaymentSchema = z.object({
  leaseId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.date(),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  status: paymentStatusSchema.optional(),
  type: z.string().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional()
});
