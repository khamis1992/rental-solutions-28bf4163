import { z } from 'zod';

// Database agreement status values
export const DB_AGREEMENT_STATUS = {
  ACTIVE: 'active',
  PENDING_PAYMENT: 'pending_payment',
  COMPLETED: 'completed',
  TERMINATED: 'terminated',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
  DRAFT: 'draft'
} as const;

// Frontend-friendly status mapping
export const AgreementStatus = {
  ACTIVE: 'active',
  PENDING: 'pending_payment',
  CANCELLED: 'cancelled',
  CLOSED: 'completed',
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

// Add the missing forceGeneratePaymentForAgreement function
export const forceGeneratePaymentForAgreement = async (
  supabase: any, 
  agreementId: string, 
  specificDate?: Date
): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log(`Forcing payment generation for agreement ${agreementId}`);
    
    // First, get the agreement details
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('rent_amount, agreement_number, start_date, status, daily_late_fee')
      .eq('id', agreementId)
      .single();
      
    if (agreementError) {
      console.error("Error fetching agreement for payment generation:", agreementError);
      return { 
        success: false, 
        message: `Failed to fetch agreement details: ${agreementError.message}`
      };
    }
    
    if (!agreement) {
      return { 
        success: false, 
        message: "Agreement not found"
      };
    }
    
    // Check if rent amount is set
    if (!agreement.rent_amount || agreement.rent_amount <= 0) {
      return { 
        success: false, 
        message: "Agreement has no valid rent amount set"
      };
    }
    
    // Calculate payment due date, typically the first of the month
    // If specificDate is provided, use that instead
    const now = new Date();
    const paymentDate = specificDate || new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Create a payment record
    const { data: payment, error: paymentError } = await supabase
      .from('unified_payments')
      .insert([{
        lease_id: agreementId,
        amount: agreement.rent_amount,
        due_date: paymentDate,
        status: 'pending',
        type: 'rent',
        description: `Monthly rent payment for ${agreement.agreement_number}`,
        original_due_date: paymentDate
      }])
      .select()
      .single();
      
    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      return { 
        success: false, 
        message: `Failed to create payment: ${paymentError.message}`
      };
    }
    
    console.log(`Successfully created payment record for agreement ${agreementId}:`, payment);
    
    return {
      success: true,
      message: "Payment schedule generated successfully"
    };
  } catch (error) {
    console.error("Unexpected error in forceGeneratePaymentForAgreement:", error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
