export type AgreementStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'terminated';
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
}

export interface AgreementFilterParams {
  customerId?: string;
  vehicleId?: string;
  status?: AgreementStatus;
  startDate?: string;
  endDate?: string;
} 