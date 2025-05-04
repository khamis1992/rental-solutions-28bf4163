
import { DbId } from './database-common';

export type LegalCaseStatus = 
  | 'open'
  | 'pending'
  | 'resolved'
  | 'cancelled'
  | 'closed';

export type LegalCaseType =
  | 'payment_default'
  | 'contract_breach'
  | 'vehicle_damage'
  | 'insurance_claim'
  | 'traffic_violation'
  | 'other';

export type CasePriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface LegalCase {
  id: string;
  customer_id: string;
  amount_owed: number;
  description: string;
  status: LegalCaseStatus;
  created_at?: string;
  updated_at?: string;
  resolution_date?: string | null;
  resolution_notes?: string | null;
  case_type?: LegalCaseType;
  priority?: CasePriority;
  assigned_to?: string;
}

// Helper function to safely cast legal case status
export function asLegalCaseStatus(status: string): LegalCaseStatus {
  return status as LegalCaseStatus;
}

// Helper function to safely cast legal case type
export function asLegalCaseType(type: string): LegalCaseType {
  return type as LegalCaseType;
}

// Helper function to safely cast case priority
export function asCasePriority(priority: string): CasePriority {
  return priority as CasePriority;
}
