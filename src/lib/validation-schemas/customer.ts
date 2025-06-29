import { z } from 'zod';
import { validationPatterns } from '@/lib/validation';

export const customerSchema = z.object({
  id: z.string().optional(),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal('')),
  phone: z.string().regex(/^[3-9]\d{7}$/, "Please enter a valid 8-digit Qatar phone number").optional(),
  phone_number: z.string().regex(/^\+974\d{8}$/, "رقم الهاتف يجب أن يبدأ بـ +974 ويتبعه 8 أرقام").optional(),
  address: z.string().min(5, "Address must be at least 5 characters").optional(),
  driver_license: z.string().min(3, "Driver license number is required").optional(),
  nationality: z.string().min(2, "Nationality is required"),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "blacklisted", "pending_review", "pending_payment"]).default("active"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // حقول جديدة من مسح البطاقة الشخصية
  id_number: z.string().regex(/^\d{11}$/, 'رقم الهوية يجب أن يكون 11 رقم').optional(),
  date_of_birth: z.string().min(1, 'تاريخ الميلاد مطلوب').optional(),
  id_expiry_date: z.string().optional(),
  gender: z.string().optional(),
  emergency_contact: z.string().optional(),
  qr_code_data: z.string().optional(),
});

export type Customer = z.infer<typeof customerSchema>;

export const customerSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "blacklisted", "pending_review", "pending_payment"]).default("all"),
});

export type CustomerSearch = z.infer<typeof customerSearchSchema>;

// CSV field names for customer import
export const customerCSVFields = [
  'Full Name',
  'Email',
  'Phone',
  'Phone Number',
  'ID Number',
  'Date of Birth',
  'Driver License',
  'Nationality',
  'Address',
  'Status',
  'Notes',
  'Gender',
  'Emergency Contact'
];

// Map from CSV column names to customer schema field names
export const customerCSVMap: Record<string, keyof Customer> = {
  'Full Name': 'full_name',
  'Email': 'email',
  'Phone': 'phone',
  'Phone Number': 'phone_number',
  'ID Number': 'id_number',
  'Date of Birth': 'date_of_birth',
  'Driver License': 'driver_license',
  'Nationality': 'nationality',
  'Address': 'address',
  'Status': 'status',
  'Notes': 'notes',
  'Gender': 'gender',
  'Emergency Contact': 'emergency_contact'
};
