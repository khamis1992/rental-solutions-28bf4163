import { z } from 'zod';
import { validationPatterns } from '@/lib/validation';

export const customerSchema = z.object({
  id: z.string().optional(),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(validationPatterns.phone, "Please enter a valid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters").optional(),
  driver_license: z.string().min(3, "Driver license number is required"),
  nationality: z.string().min(2, "Nationality is required"),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "blacklisted", "pending_review"]).default("active"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Customer = z.infer<typeof customerSchema>;

export const customerSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "blacklisted", "pending_review"]).default("all"),
});

export type CustomerSearch = z.infer<typeof customerSearchSchema>;

// CSV field names for customer import
export const customerCSVFields = [
  'Full Name',
  'Email',
  'Phone',
  'Driver License',
  'Nationality',
  'Address',
  'Status',
  'Notes'
];

// Map from CSV column names to customer schema field names
export const customerCSVMap: Record<string, keyof Customer> = {
  'Full Name': 'full_name',
  'Email': 'email',
  'Phone': 'phone',
  'Driver License': 'driver_license',
  'Nationality': 'nationality',
  'Address': 'address',
  'Status': 'status',
  'Notes': 'notes'
};
