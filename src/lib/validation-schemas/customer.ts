
import { z } from 'zod';

export type CustomerStatus = "active" | "inactive" | "pending_review" | "blacklisted" | "pending_payment";

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  driver_license: string;
  nationality: string;
  address: string;
  notes: string;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
  phone_number?: string; // For backward compatibility
}

export const customerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  driver_license: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending_review', 'blacklisted', 'pending_payment']).optional()
});

export const customerCSVFields = [
  'full_name',
  'email',
  'phone',
  'driver_license',
  'nationality',
  'address',
  'notes',
  'status'
];

export const customerCSVMap = {
  'Full Name': 'full_name',
  'Email': 'email',
  'Phone': 'phone',
  'Driver License': 'driver_license',
  'Nationality': 'nationality',
  'Address': 'address',
  'Notes': 'notes',
  'Status': 'status'
};
