
import { Customer } from "@/lib/validation-schemas/customer";
import { Vehicle } from "@/types/vehicle";

export interface SimpleAgreement {
  id: string;
  agreement_number: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
  customer?: Customer | null;
  vehicle?: Vehicle | null;
  customers?: Customer | null;
  vehicles?: Vehicle | null;
  vehicle_id?: string; // Adding this field
  customer_id?: string; // Adding this field for consistency
  created_at?: string;
  updated_at?: string;
}

// For compatibility with the existing code that uses GenericStringError
export type AgreementResponse = SimpleAgreement;
