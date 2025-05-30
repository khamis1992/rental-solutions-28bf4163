import { Database } from '@/types/database.types';
import type { Payment as PaymentType } from '@/types/payment.types';

export type LegalCase = {
  id: string;
  case_number: string;
  case_type: string;
  status: string;
  title: string;
  description?: string;
  customer_id?: string;
  vehicle_id?: string;
  agreement_id?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  resolved_at?: string;
  resolution_notes?: string;
  estimated_cost?: number;
  actual_cost?: number;
  documents?: LegalDocument[];
  communications?: LegalCommunication[];
  settlements?: LegalSettlement[];
  deadlines?: LegalDeadline[];
};

export type LegalDocument = {
  id: string;
  case_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  uploaded_by?: string;
};

export type LegalCommunication = {
  id: string;
  case_id: string;
  communication_type: 'email' | 'phone' | 'meeting' | 'letter' | 'other';
  subject?: string;
  content: string;
  direction: 'inbound' | 'outbound';
  contact_person?: string;
  created_at: string;
  created_by?: string;
};

export type LegalSettlement = {
  id: string;
  case_id: string;
  settlement_type: string;
  amount: number;
  status: 'proposed' | 'negotiating' | 'agreed' | 'rejected' | 'paid';
  agreed_date?: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type LegalDeadline = {
  id: string;
  case_id: string;
  deadline_type: string;
  description: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type LegalCaseFormData = {
  case_number: string;
  case_type: string;
  title: string;
  description?: string;
  customer_id?: string;
  vehicle_id?: string;
  agreement_id?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  due_date?: string;
  estimated_cost?: number;
};

export type LegalCaseFilters = {
  status?: string;
  case_type?: string;
  priority?: string;
  assigned_to?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
};

export type LegalCaseStats = {
  total_cases: number;
  open_cases: number;
  resolved_cases: number;
  overdue_cases: number;
  cases_by_type: Record<string, number>;
  cases_by_priority: Record<string, number>;
  average_resolution_time: number;
  total_costs: number;
};

// Settlement-related types
export type SettlementPayment = PaymentType;

export type SettlementTracker = {
  id: string;
  settlement_id: string;
  payment_id?: string;
  amount_due: number;
  amount_paid: number;
  payment_status: 'pending' | 'partial' | 'completed' | 'overdue';
  due_date: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
};
