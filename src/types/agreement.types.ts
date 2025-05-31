import { Database } from './database.types';

export type AgreementStatus = Database['public']['Enums']['agreement_status'];
export type AgreementType = 'lease' | 'rental' | 'subscription';

export interface Agreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  type: AgreementType;
  status: AgreementStatus;
  start_date: string;
  end_date: string;
  monthly_payment: number;
  security_deposit?: number;
  terms?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  terminated_at?: string;
  termination_reason?: string;
  payment_day: number;
  rent_due_day: number;
}

export interface AgreementFilterParams {
  statuses?: AgreementStatus[];
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
} 