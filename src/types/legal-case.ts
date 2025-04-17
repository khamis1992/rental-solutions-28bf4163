
export interface LegalCase {
  id: string;
  case_number: string;
  title: string;
  description: string;
  customer_id: string;
  customer_name: string;
  status: 'pending' | 'active' | 'closed' | 'settled';
  hearing_date: string;
  court_location?: string;
  assigned_attorney?: string;
  opposing_party?: string;
  case_type: 'contract_dispute' | 'traffic_violation' | 'insurance_claim' | 'customer_complaint' | 'other';
  documents?: string[];
  amount_claimed?: number;
  amount_settled?: number;
  created_at: string;
  updated_at: string;
  notes?: string;
}
