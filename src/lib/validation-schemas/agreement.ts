
import { z } from "zod";

// Define agreement statuses
export const AgreementStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  PENDING: "pending",
  CLOSED: "closed",
} as const;

// Customer and Vehicle nested objects schema
export const CustomerSchema = z.object({
  id: z.string(),
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional()
});

export const VehicleSchema = z.object({
  id: z.string(),
  make: z.string().optional(),
  model: z.string().optional(),
  license_plate: z.string().optional(),
  image_url: z.string().optional(),
  year: z.number().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  registration_number: z.string().optional()
});

// Agreement validation schema
export const agreementSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  vehicle_id: z.string(),
  start_date: z.date(),
  end_date: z.date(),
  status: z.enum([
    AgreementStatus.DRAFT,
    AgreementStatus.ACTIVE, 
    AgreementStatus.EXPIRED,
    AgreementStatus.CANCELLED,
    AgreementStatus.PENDING,
    AgreementStatus.CLOSED
  ]),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  total_amount: z.number(),
  deposit_amount: z.number().optional(),
  agreement_number: z.string(),
  notes: z.string().optional(),
  terms_accepted: z.boolean().default(false),
  signature_url: z.string().optional(),
  additional_drivers: z.array(z.string()).optional(),
  // Include the nested objects returned from Supabase
  customers: CustomerSchema.optional(),
  vehicles: VehicleSchema.optional(),
});

// Type for Agreement based on the schema
export type Agreement = z.infer<typeof agreementSchema>;

// Type for Agreement with all optional fields for filtering
export type AgreementFilters = Partial<{
  query: string;
  status: string;
  customer_id: string;
  vehicle_id: string;
  start_date: Date;
  end_date: Date;
}>;

// Helper for creating a new agreement
export const createEmptyAgreement = (): Omit<Agreement, "id"> => ({
  customer_id: "",
  vehicle_id: "",
  start_date: new Date(),
  end_date: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days
  status: AgreementStatus.DRAFT,
  total_amount: 0,
  deposit_amount: 0,
  agreement_number: `AGR-${Date.now().toString().substring(7)}`,
  notes: "",
  terms_accepted: false,
  additional_drivers: [],
});

// Function to generate monthly payment records
export const generateMonthlyPayment = async (
  supabase: any,
  agreementId: string,
  amount: number,
  month: number,
  year: number
) => {
  try {
    // First check if the agreement is still active
    const { data: agreement, error: agreementError } = await supabase
      .from("agreements")
      .select("status, agreement_number")
      .eq("id", agreementId)
      .single();
    
    if (agreementError) throw agreementError;
    
    // If agreement is not active (closed, cancelled, etc.), don't generate payment
    if (agreement && agreement.status !== 'active') {
      console.log(`Skipping payment generation for ${agreement.agreement_number} - status is ${agreement.status}`);
      return { success: false, message: `Agreement is no longer active (status: ${agreement.status})` };
    }
    
    // Create payment date - 1st of the specified month
    const paymentDate = new Date(year, month, 1);
    
    // Check if there's already a payment for this month
    const { data: existingPayments, error: checkError } = await supabase
      .from("unified_payments")
      .select("id")
      .eq("lease_id", agreementId)
      .gte("payment_date", new Date(year, month, 1).toISOString())
      .lt("payment_date", new Date(year, month + 1, 1).toISOString());
    
    if (checkError) throw checkError;
    
    // If payment already exists for this month, don't create another one
    if (existingPayments && existingPayments.length > 0) {
      console.log(`Payment already exists for agreement ${agreement.agreement_number} for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      return { success: false, message: "Payment already exists for this month" };
    }
    
    console.log(`Generating payment for agreement ${agreement.agreement_number} for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
    
    // Create pending payment record for the 1st of the month
    const { data, error } = await supabase.from("unified_payments").insert({
      lease_id: agreementId,
      amount: amount,
      amount_paid: 0,
      balance: amount,
      payment_date: paymentDate.toISOString(),
      status: "pending",
      type: "Income",
      description: `Monthly rent payment for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      original_due_date: paymentDate.toISOString(),
    }).select();
    
    if (error) throw error;
    
    console.log(`Successfully generated payment for agreement ${agreement.agreement_number}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error generating monthly payment:", error);
    return { success: false, error };
  }
};

// Function to manually generate payments for a specific agreement
export const forceGeneratePaymentForAgreement = async (
  supabase: any,
  agreementId: string
) => {
  try {
    // Get the agreement details
    const { data: agreement, error: agreementError } = await supabase
      .from("agreements")
      .select("id, total_amount, agreement_number, status")
      .eq("id", agreementId)
      .single();
    
    if (agreementError) throw agreementError;
    
    if (!agreement) {
      return { success: false, message: "Agreement not found" };
    }
    
    if (agreement.status !== 'active') {
      return { success: false, message: `Agreement is not active (current status: ${agreement.status})` };
    }
    
    // Get current month and year
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Generate a payment for the current month if it doesn't exist
    const result = await generateMonthlyPayment(
      supabase,
      agreement.id,
      agreement.total_amount,
      currentMonth,
      currentYear
    );
    
    return result;
  } catch (error) {
    console.error("Error forcing payment generation:", error);
    return { success: false, error };
  }
};
