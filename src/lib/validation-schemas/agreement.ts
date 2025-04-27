
import { z } from 'zod';

export const agreementSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string(),
  vehicle_id: z.string(),
  agreement_number: z.string().optional(),
  start_date: z.date(),
  end_date: z.date(),
  rent_amount: z.number(),
  contract_amount: z.number(),
  deposit_amount: z.number().optional().nullable(),
  daily_late_fee: z.number().optional().nullable(),
  agreement_type: z.enum(['short_term', 'long_term', 'rental', 'lease_to_own']),
  agreement_duration: z.string().optional(),
  rent_due_day: z.number().optional().nullable(),
  due_date: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'pending', 'draft', 'completed', 'cancelled', 'pending_payment', 'pending_deposit', 'expired', 'terminated', 'archived', 'closed']).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  last_payment_date: z.date().optional().nullable(),
  terms_accepted: z.boolean().optional().default(false),
  total_amount: z.number().optional(),
  
  // Related entities
  customer_name: z.string().optional(),
  customer_email: z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  vehicles: z.object({
    make: z.string(),
    model: z.string(),
    license_plate: z.string(),
    year: z.number().optional()
  }).optional().nullable(),
  customers: z.object({
    id: z.string(),
    full_name: z.string(),
    phone_number: z.string().optional().nullable(),
    email: z.string().optional().nullable()
  }).optional().nullable()
});

export type Agreement = z.infer<typeof agreementSchema>;

export enum AgreementStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  DRAFT = 'draft',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PENDING_PAYMENT = 'pending_payment',
  PENDING_DEPOSIT = 'pending_deposit',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  ARCHIVED = 'archived',
  CLOSED = 'closed'
}
