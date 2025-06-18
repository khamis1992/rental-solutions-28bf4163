import { toast } from 'sonner';
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { LeaseStatus, ValidationLeaseStatus } from '@/types/lease-types';

// Enum for agreement status
export const AgreementStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  CLOSED: 'closed',
  EXPIRED: 'expired',
  DRAFT: 'draft'
} as const;

// Function to generate next agreement number
export const generateAgreementNumber = async (supabase: SupabaseClient): Promise<string> => {
  try {
    // Get the highest existing AGR_LTO number
    const { data, error } = await supabase
      .from('leases')
      .select('agreement_number')
      .like('agreement_number', 'AGR_LTO%')
      .order('agreement_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching agreement numbers:', error);
      throw new Error('Failed to generate agreement number');
    }

    let nextNumber = 1;
    
    if (data && data.length > 0 && data[0].agreement_number) {
      // Extract number from AGR_LTO### format
      const match = data[0].agreement_number.match(/AGR_LTO(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format with leading zeros (3 digits)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    return `AGR_LTO${formattedNumber}`;
  } catch (error) {
    console.error('Error generating agreement number:', error);
    throw new Error('Failed to generate agreement number');
  }
};

// Add the missing agreementSchema with optional agreement_number
export const agreementSchema = z.object({
  agreement_number: z.string().optional(), // Make optional for auto-generation
  start_date: z.string().transform((str) => new Date(str)), // Handle string to date conversion
  end_date: z.string().transform((str) => new Date(str)),   // Handle string to date conversion
  customer_id: z.string().min(1, "العميل مطلوب"),
  vehicle_id: z.string().min(1, "المركبة مطلوبة"),
  status: z.enum(["draft", "active", "pending", "expired", "cancelled", "closed"]).default("draft"),
  rent_amount: z.number().positive("يجب أن يكون مبلغ الإيجار أكبر من صفر"),
  deposit_amount: z.number().nonnegative("يجب أن يكون مبلغ الضمان صفر أو أكبر").default(0),
  total_amount: z.number().nonnegative("يجب أن يكون المبلغ الإجمالي صفر أو أكبر").default(0),
  daily_late_fee: z.number().nonnegative("يجب أن تكون رسوم التأخير صفر أو أكبر").default(100),
  agreement_type: z.enum(["short_term", "lease_to_own"]).default("short_term"),
  agreement_duration: z.string().optional(),
  notes: z.string().optional().default(""),
  payment_frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly"]).default("monthly"),
  payment_day: z.number().min(1).max(31).default(1),
  // Mark as optional with a default value so it's available in the UI but not sent to DB
  terms_accepted: z.boolean().default(false).optional(),
}).refine(
  (data) => {
    // Ensure end_date is after start_date
    return data.end_date > data.start_date;
  },
  {
    message: "يجب أن يكون تاريخ النهاية بعد تاريخ البداية",
    path: ["end_date"],
  }
);

// Update schema for existing agreements (more flexible validation)
export const updateAgreementSchema = z.object({
  agreement_number: z.string().optional(),
  start_date: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
  end_date: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
  customer_id: z.string().min(1, "العميل مطلوب"),
  vehicle_id: z.string().min(1, "المركبة مطلوبة"),
  status: z.enum(["draft", "active", "pending", "expired", "cancelled", "closed"]).default("draft"),
  rent_amount: z.number().positive("يجب أن يكون مبلغ الإيجار أكبر من صفر"),
  deposit_amount: z.number().nonnegative("يجب أن يكون مبلغ الضمان صفر أو أكبر").default(0),
  total_amount: z.number().nonnegative("يجب أن يكون المبلغ الإجمالي صفر أو أكبر").default(0),
  daily_late_fee: z.number().nonnegative("يجب أن تكون رسوم التأخير صفر أو أكبر").default(100),
  agreement_type: z.enum(["short_term", "lease_to_own"]).default("short_term"),
  agreement_duration: z.string().optional(),
  notes: z.string().optional(),
  terms_accepted: z.boolean().default(false).optional(),
  payment_frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly"]).default("monthly").optional(),
  payment_day: z.number().min(1).max(31).default(1).optional(),
}).refine(
  (data) => {
    // Only validate date relationship if both dates are provided
    if (data.start_date && data.end_date) {
      return data.end_date > data.start_date;
    }
    return true;
  },
  {
    message: "يجب أن يكون تاريخ النهاية بعد تاريخ البداية",
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
  start_date: Date | string;
  end_date: Date | string;
  agreement_type?: string;
  agreement_number?: string;
  status: LeaseStatus;
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
  rent_due_day?: number;
  payment_day?: number;
  payment_frequency?: string;
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
