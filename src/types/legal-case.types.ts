
/**
 * Core types for Legal Case Management
 * @module LegalTypes
 */

import { DbId } from './database-common';

/**
 * Legal case types handled by the system
 */
export enum LegalCaseType {
  PAYMENT_DEFAULT = 'payment_default',
  CONTRACT_BREACH = 'contract_breach',
  VEHICLE_DAMAGE = 'vehicle_damage',
  TRAFFIC_VIOLATION = 'traffic_violation',
  DOCUMENT_FRAUD = 'document_fraud',
  INSURANCE_CLAIM = 'insurance_claim',
  OTHER = 'other'
}

/**
 * Current status of a legal case
 */
export enum LegalCaseStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated'
}

/**
 * Case priority levels
 */
export enum CasePriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Core legal case data structure
 */
export interface LegalCase {
  /** Unique case identifier */
  id: DbId;
  /** Associated customer */
  customer_id: DbId;
  /** Type of legal case */
  case_type: LegalCaseType;
  /** Current case status */
  status: LegalCaseStatus | null;
  /** Outstanding amount if applicable */
  amount_owed: number;
  /** Case priority level */
  priority: CasePriority | null;
  /** Staff member assigned to case */
  assigned_to: DbId | null;
  /** Case description/details */
  description: string | null;
  /** Date case was resolved */
  resolution_date: string | null;
  /** Notes about case resolution */
  resolution_notes: string | null;
  /** Timestamps */
  created_at: string;
  updated_at: string;
  /** Associated customer details */
  profiles?: {
    full_name: string;
    email: string | null;
    phone_number: string | null;
  };
}

/**
 * Legal case audit trail entry
 */
export interface CaseHistoryEntry {
  id: DbId;
  case_id: DbId;
  action: string;
  description?: string;
  performed_by?: DbId;
  timestamp: string;
}

/**
 * Legal document associated with a case
 */
export interface LegalDocument {
  id: DbId;
  case_id: DbId;
  document_type: string;
  content: string;
  status: string;
  generated_by?: DbId;
  created_at: string;
}

/**
 * Settlement agreement details
 */
export interface Settlement {
  id: DbId;
  case_id: DbId;
  terms: string;
  total_amount: number;
  payment_plan?: PaymentPlan;
  status: string;
  signed_date?: string;
  created_at: string;
}

/**
 * Payment plan for settlements
 */
interface PaymentPlan {
  total_amount: number;
  installments: number;
  frequency: string;
  start_date: string;
  payments: Payment[];
}
