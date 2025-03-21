
import { z } from "zod";

// Define agreement statuses
export const AgreementStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  PENDING: "pending",
} as const;

// Agreement validation schema
export const agreementSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  start_date: z.date(),
  end_date: z.date(),
  status: z.enum([
    AgreementStatus.DRAFT,
    AgreementStatus.ACTIVE, 
    AgreementStatus.EXPIRED,
    AgreementStatus.CANCELLED,
    AgreementStatus.PENDING
  ]),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  total_amount: z.number().min(0, "Total amount must be a positive number"),
  deposit_amount: z.number().min(0, "Deposit must be a positive number"),
  agreement_number: z.string().optional(),
  notes: z.string().optional(),
  terms_accepted: z.boolean().default(false),
  signature_url: z.string().optional(),
  pickup_location: z.string().optional(),
  return_location: z.string().optional(),
  additional_drivers: z.array(z.string()).optional(),
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
  pickup_location: "",
  return_location: "",
  additional_drivers: [],
});
