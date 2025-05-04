
import { DbId } from './database-common';

export enum LegalCaseStatus {
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
  ACTIVE = 'active',
  ESCALATED = 'escalated'
}

export enum LegalCaseType {
  PAYMENT_DEFAULT = 'payment_default',
  CONTRACT_BREACH = 'contract_breach',
  VEHICLE_DAMAGE = 'vehicle_damage',
  INSURANCE_CLAIM = 'insurance_claim',
  TRAFFIC_VIOLATION = 'traffic_violation',
  OTHER = 'other'
}

export enum CasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface LegalCase {
  id: string;
  customer_id: string;
  amount_owed: number;
  description: string;
  status: LegalCaseStatus | string;
  created_at?: string;
  updated_at?: string;
  resolution_date?: string | null;
  resolution_notes?: string | null;
  case_type?: LegalCaseType | string;
  priority?: CasePriority | string;
  assigned_to?: string;
  profiles?: {
    full_name: string;
    email: string | null;
    phone_number: string | null;
  };
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
