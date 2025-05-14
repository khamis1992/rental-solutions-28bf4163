/**
 * Zod schemas for traffic fines data validation
 */
import { z } from 'zod';

/**
 * Traffic fine status schema
 */
export const trafficFineStatusSchema = z.enum([
  'pending',
  'paid',
  'disputed',
  'overdue',
  'waived',
  'billed_to_customer',
  'processing'
]);

/**
 * Violation type schema
 */
export const violationTypeSchema = z.enum([
  'speeding',
  'parking',
  'red_light',
  'no_permit',
  'improper_lane_change',
  'other'
]);

/**
 * Traffic fine schema for validation
 */
export const trafficFineSchema = z.object({
  id: z.string().optional(),
  vehicle_id: z.string(),
  license_plate: z.string().min(1, 'License plate is required'),
  violation_date: z.string(),
  violation_type: violationTypeSchema,
  violation_location: z.string().optional(),
  fine_amount: z.number().positive(),
  status: trafficFineStatusSchema,
  due_date: z.string().optional(),
  payment_date: z.string().optional(),
  reference_number: z.string().optional(),
  issuing_authority: z.string().optional(),
  driver_name: z.string().optional(),
  notes: z.string().optional(),
  agreement_id: z.string().optional(),
  customer_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  image_url: z.string().optional(),
  payment_receipt_url: z.string().optional(),
  disputed_reason: z.string().optional(),
  disputed_date: z.string().optional(),
  disputed_status: z.enum(['pending', 'approved', 'rejected']).optional()
});

/**
 * Traffic fine insert schema for validation
 */
export const trafficFineInsertSchema = trafficFineSchema.omit({ 
  id: true,
  created_at: true,
  updated_at: true
});

/**
 * Traffic fine update schema for validation
 */
export const trafficFineUpdateSchema = trafficFineSchema.partial();

/**
 * Traffic fine validation schema
 */
export const trafficFineValidationSchema = z.object({
  id: z.string().optional(),
  license_plate: z.string().min(1, 'License plate is required'),
  validation_date: z.string(),
  result: z.enum(['clean', 'found', 'error']),
  status: z.enum(['pending', 'processed', 'failed']),
  fine_id: z.string().optional(),
  batch_id: z.string().optional(),
  created_at: z.string().optional(),
  error_message: z.string().optional(),
  validated_by: z.string().optional(),
  source: z.string().optional()
});

/**
 * Payment details schema for traffic fine payment
 */
export const paymentDetailsSchema = z.object({
  paymentDate: z.date(),
  paymentReference: z.string().optional(),
  paymentReceiptUrl: z.string().optional()
});

/**
 * Create traffic fine schema with enhanced validation
 */
export const createTrafficFineSchema = z.object({
  vehicleId: z.string(),
  licensePlate: z.string().min(1, 'License plate is required'),
  violationDate: z.date(),
  violationType: violationTypeSchema,
  violationLocation: z.string().optional(),
  fineAmount: z.number().positive(),
  status: trafficFineStatusSchema.optional(),
  dueDate: z.date().optional(),
  issuingAuthority: z.string().optional(),
  driverName: z.string().optional(),
  notes: z.string().optional(),
  agreementId: z.string().optional(),
  customerId: z.string().optional()
});
