
import { z } from 'zod';
import { isValidUUID } from '@/lib/uuid-validation';

// Create a proper Zod schema for validation
export const agreementSchema = z.object({
  id: z.string().optional(),
  agreement_number: z.string().min(1, "Agreement number is required"),
  customer_id: z.string().refine((val) => isValidUUID(val), {
    message: "Invalid customer ID format"
  }),
  vehicle_id: z.string().refine((val) => isValidUUID(val), {
    message: "Invalid vehicle ID format"
  }),
  start_date: z.union([z.string(), z.date()]),
  end_date: z.union([z.string(), z.date()]),
  rent_amount: z.number().min(0, "Rent amount must be positive"),
  total_amount: z.number().min(0, "Total amount must be positive"),
  status: z.enum(['draft', 'active', 'pending', 'closed', 'cancelled', 'expired']),
  daily_late_fee: z.number().optional(),
  rent_due_day: z.number().optional(),
  agreement_duration: z.string().optional(),
  lease_duration: z.string().optional(),
  initial_mileage: z.number().optional(),
  agreement_type: z.string().optional(),
  notes: z.string().optional(),
  template_id: z.string().optional(),
  processed_content: z.string().optional(),
  terms_accepted: z.boolean().optional(),
  deposit_amount: z.number().optional(),
  additional_drivers: z.array(z.string()).optional(),
  created_at: z.union([z.string(), z.date()]).optional(),
  updated_at: z.union([z.string(), z.date()]).optional(),
  customers: z.any().optional(),
  profiles: z.any().optional(),
  vehicles: z.any().optional(),
});
