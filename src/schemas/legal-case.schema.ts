/**
 * Zod schemas for legal case data validation
 */
import { z } from 'zod';

/**
 * Legal case type schema
 */
export const legalCaseTypeSchema = z.enum([
  'payment_default',
  'contract_breach',
  'vehicle_damage',
  'traffic_violation',
  'document_fraud',
  'insurance_claim',
  'other'
]);

/**
 * Legal case status schema
 */
export const legalCaseStatusSchema = z.enum([
  'active',
  'pending',
  'resolved',
  'escalated'
]);

/**
 * Case priority schema
 */
export const casePrioritySchema = z.enum([
  'high',
  'medium',
  'low'
]);

/**
 * Legal case schema for validation
 */
export const legalCaseSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string(),
  case_type: legalCaseTypeSchema,
  status: legalCaseStatusSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  filed_date: z.string(),
  resolution_date: z.string().optional(),
  priority: casePrioritySchema,
  case_number: z.string().optional(),
  assigned_to: z.string().optional(),
  agreement_id: z.string().optional(),
  vehicle_id: z.string().optional(),
  court_date: z.string().optional(),
  court_location: z.string().optional(),
  resolution_notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  documents: z.array(z.any()).optional()
});

/**
 * Legal case insert schema for validation
 */
export const legalCaseInsertSchema = legalCaseSchema.omit({ 
  id: true,
  created_at: true,
  updated_at: true,
  documents: true
});

/**
 * Legal case update schema for validation
 */
export const legalCaseUpdateSchema = legalCaseSchema.partial();

/**
 * Legal case document schema
 */
export const legalCaseDocumentSchema = z.object({
  id: z.string().optional(),
  case_id: z.string(),
  file_name: z.string().min(1, 'File name is required'),
  file_path: z.string().min(1, 'File path is required'),
  file_type: z.string(),
  file_size: z.number().nonnegative().optional(),
  uploaded_by: z.string().optional(),
  document_type: z.string().optional(),
  document_date: z.string().optional(),
  description: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

/**
 * Create legal case schema with enhanced validation
 */
export const createLegalCaseSchema = z.object({
  customerId: z.string(),
  caseType: legalCaseTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  filedDate: z.date(),
  priority: casePrioritySchema.optional(),
  caseNumber: z.string().optional(),
  assignedTo: z.string().optional(),
  agreementId: z.string().optional(),
  vehicleId: z.string().optional(),
  courtDate: z.date().optional(),
  courtLocation: z.string().optional()
});
