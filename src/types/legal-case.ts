
export interface LegalCase {
  id: string;
  customer_id: string;
  case_type: LegalCaseType;
  status: LegalCaseStatus | null;
  amount_owed: number;
  priority: CasePriority | null;
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

export enum LegalCaseType {
  PAYMENT_DEFAULT = 'payment_default',
  CONTRACT_BREACH = 'contract_breach',
  VEHICLE_DAMAGE = 'vehicle_damage',
  TRAFFIC_VIOLATION = 'traffic_violation',
  DOCUMENT_FRAUD = 'document_fraud',
  INSURANCE_CLAIM = 'insurance_claim',
  OTHER = 'other'
}

export enum LegalCaseStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated'
}

export enum CasePriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}
