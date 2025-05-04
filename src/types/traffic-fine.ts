
import { DbId } from './database-common';

export interface TrafficFine {
  id: DbId;
  violation_number?: string;
  license_plate: string;
  violation_date: string | Date;
  fine_amount?: number;
  fine_location?: string;
  payment_status?: string;
  payment_date?: string | Date;
  lease_id?: DbId;
  vehicle_id?: DbId;
  validation_status?: string;
  assignment_status?: string;
  fine_type?: string;
  violation_points?: number;
  violation_charge?: string;
  payment_reference?: string;
  entry_type?: string;
  serial_number?: string;
  validation_result?: any;
  last_check_date?: string | Date;
  validation_attempts?: number;
  created_at?: string;
  updated_at?: string;
}
