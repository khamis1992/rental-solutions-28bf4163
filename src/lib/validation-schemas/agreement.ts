
import { z } from 'zod';

// Database agreement status values
export const DB_AGREEMENT_STATUS = {
  ACTIVE: 'active',
  PENDING_PAYMENT: 'pending_payment',
  PENDING_DEPOSIT: 'pending_deposit',
  COMPLETED: 'completed',
  TERMINATED: 'terminated',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
  DRAFT: 'draft'
} as const;

// Frontend-friendly status mapping
export const AgreementStatus = {
  ACTIVE: 'active',
  PENDING: 'pending_payment', // Maps to both pending_payment and pending_deposit
  CANCELLED: 'cancelled',
  CLOSED: 'completed', // Maps to both completed and terminated
  EXPIRED: 'archived',
  DRAFT: 'draft'
} as const;

export type DatabaseAgreementStatus = typeof DB_AGREEMENT_STATUS[keyof typeof DB_AGREEMENT_STATUS];
export type FrontendAgreementStatus = typeof AgreementStatus[keyof typeof AgreementStatus];

// Agreement validation schema
export const agreementSchema = z.object({
  agreement_number: z.string().min(1, "Agreement number is required"),
  start_date: z.date(),
  end_date: z.date(),
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  status: z.enum([
    'active',
    'pending_payment',
    'pending_deposit',
    'completed',
    'terminated',
    'cancelled',
    'archived',
    'draft'
  ]),
  rent_amount: z.number().positive("Rent amount must be positive"),
  deposit_amount: z.number().nonnegative("Deposit amount must be non-negative"),
  total_amount: z.number().positive("Total amount must be positive"),
  daily_late_fee: z.number().nonnegative("Daily late fee must be non-negative"),
  agreement_duration: z.string().optional(),
  notes: z.string().optional(),
  terms_accepted: z.boolean().default(false),
});

// Base agreement interface with required fields
export interface BaseAgreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: Date;
  end_date: Date;
  status: DatabaseAgreementStatus;
}

// Full agreement interface extending base with optional fields
export interface Agreement extends BaseAgreement {
  agreement_type?: string;
  agreement_number?: string;
  total_amount?: number;
  monthly_payment?: number;
  agreement_duration?: string;
  customer_name?: string;
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  created_at?: Date;
  updated_at?: Date;
  signature_url?: string;
  deposit_amount?: number;
  notes?: string;
  customers?: any;
  vehicles?: any;
  terms_accepted: boolean;
  additional_drivers: string[];
  rent_amount?: number;
  daily_late_fee?: number;
}

// Helper function to map database status to frontend status
export const mapDBStatusToFrontend = (dbStatus: DatabaseAgreementStatus): FrontendAgreementStatus => {
  switch(dbStatus) {
    case DB_AGREEMENT_STATUS.ACTIVE:
      return AgreementStatus.ACTIVE;
    case DB_AGREEMENT_STATUS.PENDING_PAYMENT:
    case DB_AGREEMENT_STATUS.PENDING_DEPOSIT:
      return AgreementStatus.PENDING;
    case DB_AGREEMENT_STATUS.CANCELLED:
      return AgreementStatus.CANCELLED;
    case DB_AGREEMENT_STATUS.COMPLETED:
    case DB_AGREEMENT_STATUS.TERMINATED:
      return AgreementStatus.CLOSED;
    case DB_AGREEMENT_STATUS.ARCHIVED:
      return AgreementStatus.EXPIRED;
    case DB_AGREEMENT_STATUS.DRAFT:
      return AgreementStatus.DRAFT;
    default:
      return AgreementStatus.DRAFT;
  }
};

// Helper function to map frontend status to database status
export const mapFrontendToDB = (frontendStatus: FrontendAgreementStatus): DatabaseAgreementStatus => {
  switch(frontendStatus) {
    case AgreementStatus.ACTIVE:
      return DB_AGREEMENT_STATUS.ACTIVE;
    case AgreementStatus.PENDING:
      return DB_AGREEMENT_STATUS.PENDING_PAYMENT;
    case AgreementStatus.CANCELLED:
      return DB_AGREEMENT_STATUS.CANCELLED;
    case AgreementStatus.CLOSED:
      return DB_AGREEMENT_STATUS.COMPLETED;
    case AgreementStatus.EXPIRED:
      return DB_AGREEMENT_STATUS.ARCHIVED;
    case AgreementStatus.DRAFT:
      return DB_AGREEMENT_STATUS.DRAFT;
    default:
      return DB_AGREEMENT_STATUS.DRAFT;
  }
};
