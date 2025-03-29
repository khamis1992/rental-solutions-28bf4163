
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
  phone: z.string().optional(),
  driver_license: z.string().optional(),
  nationality: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional()
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
  template_url: z.string().optional(),
  additional_drivers: z.array(z.string()).optional(),
  daily_late_fee: z.number().optional(),
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
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("status, agreement_number")
      .eq("id", agreementId)
      .single();
    
    if (leaseError) throw leaseError;
    
    // If lease is not active (closed, cancelled, etc.), don't generate payment
    if (lease && lease.status !== 'active') {
      console.log(`Skipping payment generation for ${lease.agreement_number} - status is ${lease.status}`);
      return { success: false, message: `Lease is no longer active (status: ${lease.status})` };
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
      console.log(`Payment already exists for agreement ${lease.agreement_number} for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      return { success: false, message: "Payment already exists for this month" };
    }
    
    console.log(`Generating payment for agreement ${lease.agreement_number} for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
    
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
    
    console.log(`Successfully generated payment for agreement ${lease.agreement_number}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error generating monthly payment:", error);
    return { success: false, error };
  }
};

// Helper function to process template with dynamic values
export const processAgreementTemplate = (templateText: string, data: any): string => {
  // Replace placeholders with actual data
  let processedTemplate = templateText;
  
  // Customer data
  if (data.customer_data) {
    processedTemplate = processedTemplate
      .replace(/\{\{CUSTOMER_NAME\}\}/g, data.customer_data.full_name || '')
      .replace(/\{\{CUSTOMER_EMAIL\}\}/g, data.customer_data.email || '')
      .replace(/\{\{CUSTOMER_PHONE\}\}/g, data.customer_data.phone_number || '')
      .replace(/\{\{CUSTOMER_LICENSE\}\}/g, data.customer_data.driver_license || '')
      .replace(/\{\{CUSTOMER_NATIONALITY\}\}/g, data.customer_data.nationality || '')
      .replace(/\{\{CUSTOMER_ADDRESS\}\}/g, data.customer_data.address || '');
  }
  
  // Vehicle data
  if (data.vehicle_data) {
    processedTemplate = processedTemplate
      .replace(/\{\{VEHICLE_MAKE\}\}/g, data.vehicle_data.make || '')
      .replace(/\{\{VEHICLE_MODEL\}\}/g, data.vehicle_data.model || '')
      .replace(/\{\{VEHICLE_YEAR\}\}/g, data.vehicle_data.year?.toString() || '')
      .replace(/\{\{VEHICLE_COLOR\}\}/g, data.vehicle_data.color || '')
      .replace(/\{\{VEHICLE_PLATE\}\}/g, data.vehicle_data.license_plate || '')
      .replace(/\{\{VEHICLE_VIN\}\}/g, data.vehicle_data.vin || '');
  }
  
  // Agreement data
  processedTemplate = processedTemplate
    .replace(/\{\{AGREEMENT_NUMBER\}\}/g, data.agreement_number || '')
    .replace(/\{\{START_DATE\}\}/g, new Date(data.start_date).toLocaleDateString() || '')
    .replace(/\{\{END_DATE\}\}/g, new Date(data.end_date).toLocaleDateString() || '')
    .replace(/\{\{RENT_AMOUNT\}\}/g, data.rent_amount?.toString() || '')
    .replace(/\{\{DEPOSIT_AMOUNT\}\}/g, data.deposit_amount?.toString() || '')
    .replace(/\{\{TOTAL_AMOUNT\}\}/g, data.total_amount?.toString() || '')
    .replace(/\{\{DAILY_LATE_FEE\}\}/g, data.daily_late_fee?.toString() || '')
    .replace(/\{\{AGREEMENT_DURATION\}\}/g, data.agreement_duration || '')
    .replace(/\{\{CURRENT_DATE\}\}/g, new Date().toLocaleDateString());
    
  return processedTemplate;
};
