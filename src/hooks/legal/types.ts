
export interface LegalCase {
  id: string;
  customer_id: string;
  case_type: string;
  status: string;
  description?: string;
  priority?: string;
  amount_owed: number;
  reminder_count: number;
  last_reminder_sent?: string;
  escalation_date?: string;
  resolution_date?: string;
  resolution_notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface UseLegalCasesOptions {
  customerId?: string;
  agreementId?: string;
  status?: string;
}
