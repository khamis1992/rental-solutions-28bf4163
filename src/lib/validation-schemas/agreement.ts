
import { toast } from 'sonner';
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ValidationLeaseStatus } from '@/types/lease-types';

// Enum for agreement status
export const AgreementStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  CLOSED: 'closed',
  EXPIRED: 'expired',
  DRAFT: 'draft'
} as const;

// Add the missing agreementSchema
export const agreementSchema = z.object({
  agreement_number: z.string().min(1, "Agreement number is required"),
  start_date: z.date(),
  end_date: z.date(),
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  status: z.enum(["draft", "active", "pending", "expired", "cancelled", "closed"]) as z.ZodEnum<[ValidationLeaseStatus, ...ValidationLeaseStatus[]]>,
  rent_amount: z.number().positive("Rent amount must be positive"),
  deposit_amount: z.number().nonnegative("Deposit amount must be non-negative"),
  total_amount: z.number().positive("Total amount must be positive"),
  daily_late_fee: z.number().nonnegative("Daily late fee must be non-negative"),
  agreement_duration: z.string().optional(),
  notes: z.string().optional(),
  // Mark as optional with a default value so it's available in the UI but not sent to DB
  terms_accepted: z.boolean().default(false).optional(),
}).refine(
  (data) => {
    // Ensure end_date is after start_date
    return data.end_date > data.start_date;
  },
  {
    message: "End date must be after start date",
    path: ["end_date"],
  }
);

// Enum for payment status
export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  PARTIALLY_PAID: 'partially_paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

// Agreement interface
export interface Agreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: Date;
  end_date: Date;
  agreement_type?: string;
  agreement_number?: string;
  status: typeof AgreementStatus[keyof typeof AgreementStatus];
  total_amount?: number;
  monthly_payment?: number;
  agreement_duration?: any;
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
  terms_accepted?: boolean;
  additional_drivers?: string[];
  rent_amount?: number;
  daily_late_fee?: number;
}

// Function to force generate payment for a specific agreement
export const forceGeneratePaymentForAgreement = async (
  supabase: SupabaseClient,
  agreementId: string, 
  specificMonth?: Date // Optional parameter to specify which month to generate for
): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log(`Generating payment schedule for agreement ${agreementId}${specificMonth ? ` for ${specificMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}` : ''}`);
    
    // Get the agreement details
    const { data: agreement, error } = await supabase
      .from('leases')
      .select('id, agreement_number, rent_amount, start_date, status, daily_late_fee')
      .eq('id', agreementId)
      .single();
      
    if (error) {
      console.error("Error fetching agreement:", error);
      return { success: false, message: `Error fetching agreement: ${error.message}` };
    }
    
    if (!agreement) {
      return { success: false, message: "Agreement not found" };
    }
    
    if (agreement.status !== 'active') {
      return { success: false, message: `Agreement is not active (status: ${agreement.status})` };
    }
    
    if (!agreement.rent_amount) {
      return { success: false, message: "Agreement has no rent amount" };
    }
    
    // Determine which month to generate for
    const today = new Date();
    const monthToGenerate = specificMonth || today;
    
    // Check if payment already exists for this month
    const monthStart = new Date(monthToGenerate.getFullYear(), monthToGenerate.getMonth(), 1);
    const monthEnd = new Date(monthToGenerate.getFullYear(), monthToGenerate.getMonth() + 1, 0);
    
    const { data: existingPayments, error: checkError } = await supabase
      .from('unified_payments')
      .select('id')
      .eq('lease_id', agreementId)
      .eq('type', 'rent')
      .gte('original_due_date', monthStart.toISOString())
      .lt('original_due_date', monthEnd.toISOString());
      
    if (checkError) {
      console.error("Error checking existing payments:", checkError);
      return { success: false, message: `Error checking existing payments: ${checkError.message}` };
    }
    
    if (existingPayments && existingPayments.length > 0) {
      console.log(`Payment already exists for ${monthToGenerate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      return { success: false, message: `Payment already exists for ${monthToGenerate.toLocaleString('default', { month: 'long', year: 'numeric' })}` };
    }
    
    // Calculate due date (1st of the month)
    const dueDate = new Date(monthToGenerate.getFullYear(), monthToGenerate.getMonth(), 1);
    
    // Calculate if payment is overdue
    const isOverdue = today > dueDate;
    const daysOverdue = isOverdue ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Calculate late fee if applicable
    const dailyLateFee = agreement.daily_late_fee || 120; // Default to 120 QAR per day if not specified
    const lateFineAmount = isOverdue ? Math.min(daysOverdue * dailyLateFee, 3000) : 0; // Cap at 3000 QAR
    
    // Create the payment record
    const { data: newPayment, error: createError } = await supabase
      .from('unified_payments')
      .insert({
        lease_id: agreementId,
        amount: agreement.rent_amount,
        amount_paid: 0,
        balance: agreement.rent_amount,
        description: `Monthly Rent - ${monthToGenerate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        type: 'rent',
        status: 'pending',
        payment_date: null,
        original_due_date: dueDate.toISOString(),
        days_overdue: daysOverdue,
        late_fine_amount: lateFineAmount // Using late_fine_amount instead of daily_late_fee
      })
      .select()
      .single();
      
    if (createError) {
      console.error("Error creating payment:", createError);
      return { success: false, message: `Error creating payment: ${createError.message}` };
    }
    
    console.log(`Successfully generated payment schedule for ${monthToGenerate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
    return { 
      success: true, 
      message: `Successfully generated payment for ${monthToGenerate.toLocaleString('default', { month: 'long', year: 'numeric' })}` 
    };
    
  } catch (error) {
    console.error("Unexpected error in forceGeneratePaymentForAgreement:", error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

