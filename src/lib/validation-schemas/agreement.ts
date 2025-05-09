
import { z } from 'zod';

export enum AgreementStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  CLOSED = 'closed'
}

export const agreementSchema = z.object({
  id: z.string().optional(),
  agreement_number: z.string().min(1, { message: 'Agreement number is required' }),
  status: z.string().optional().default(AgreementStatus.DRAFT),
  customer_id: z.string().min(1, { message: 'Customer is required' }),
  vehicle_id: z.string().min(1, { message: 'Vehicle is required' }),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()),
  total_amount: z.number().min(0),
  rent_amount: z.number().min(0).optional(),
  payment_frequency: z.string().optional(),
  deposit_amount: z.number().min(0).optional(),
  notes: z.string().optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional()
});

export type AgreementFormData = z.infer<typeof agreementSchema>;

export interface Agreement {
  id: string;
  agreement_number: string;
  status: string;
  customer_id: string;
  vehicle_id: string;
  start_date: Date | string;
  end_date: Date | string;
  total_amount: number;
  rent_amount?: number;
  payment_frequency?: string;
  deposit_amount?: number;
  notes?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  customers?: any;
  vehicles?: any;
}
