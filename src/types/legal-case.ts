
export interface LegalCase {
  id: string;
  customer_id: string;
  case_type: string;
  status: string | null;
  amount_owed: number;
  priority: string | null;
  assigned_to: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  resolution_date: string | null;
  resolution_notes: string | null;
  profiles?: {
    full_name: string;
    email: string | null;
    phone_number: string | null;
  };
}
