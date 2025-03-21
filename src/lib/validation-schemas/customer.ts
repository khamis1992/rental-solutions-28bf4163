
import { z } from 'zod';
import { validationPatterns } from '@/lib/validation';

export const customerSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  full_name: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(validationPatterns.phone, "Please enter a valid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters").optional(),
  driver_license: z.string().min(3, "Driver license number is required"),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "blacklisted"]).default("active"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Customer = z.infer<typeof customerSchema>;

export const customerSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "blacklisted"]).default("all"),
});

export type CustomerSearch = z.infer<typeof customerSearchSchema>;
