
import { DbId, PaymentStatus, TrafficFineId } from '@/types/database-common';

export interface TrafficFine {
  id: TrafficFineId;
  violation_number?: string;
  fine_number: string;
  fine_date: string;
  license_plate?: string;
  vehicle_id?: string;
  lease_id?: string;
  agreement_id?: string;
  violation_date?: string;
  fine_amount?: number;
  amount: number;
  violation_charge?: string;
  payment_status: PaymentStatus;
  fine_location?: string;
  payment_date?: string | null;
  vehicle?: {
    license_plate?: string;
    make?: string;
    model?: string;
  };
  vehicle_make?: string;
  vehicle_model?: string;
  customer_id?: string;
  customer_name?: string;
}

export interface PaginatedTrafficFineResult {
  data: TrafficFine[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
