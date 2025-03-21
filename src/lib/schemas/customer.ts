
import { z } from 'zod';
import { validationPatterns } from '@/lib/validation';

// Customer schema with validation
export const customerSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(validationPatterns.phone, "Invalid phone number format"),
  driving_license: z.string().min(5, "Driving license is required"),
  address: z.string().optional(),
  customer_type: z.enum(["individual", "corporate"]),
  company_name: z.string().optional().nullable(),
  tax_number: z.string().optional().nullable(),
  status: z.enum(["active", "pending", "inactive"]),
  notes: z.string().optional().nullable(),
  created_at: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

// Create a schema for filtering customers
export const customerFilterSchema = z.object({
  status: z.enum(["active", "pending", "inactive"]).optional(),
  customer_type: z.enum(["individual", "corporate"]).optional(),
  search: z.string().optional(),
});

export type CustomerFilters = z.infer<typeof customerFilterSchema>;

// Export helper functions for customer data
export const getFullName = (customer: Pick<CustomerFormValues, 'first_name' | 'last_name'>) => {
  return `${customer.first_name} ${customer.last_name}`;
};

export const getCustomerTypeLabel = (type: CustomerFormValues['customer_type']) => {
  return type === 'corporate' ? 'Corporate' : 'Individual';
};

export const getCustomerStatusLabel = (status: CustomerFormValues['status']) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pending':
      return 'Pending';
    case 'inactive':
      return 'Inactive';
    default:
      return status;
  }
};
