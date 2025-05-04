
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

// Add the missing mapTrafficFineResponse function
export function mapTrafficFineResponse(data: any): TrafficFine {
  if (!data) return {} as TrafficFine;
  
  return {
    id: data.id,
    violation_number: data.violation_number,
    license_plate: data.license_plate,
    violation_date: data.violation_date,
    fine_amount: data.fine_amount,
    fine_location: data.fine_location || data.location,
    payment_status: data.payment_status,
    payment_date: data.payment_date,
    lease_id: data.lease_id,
    vehicle_id: data.vehicle_id,
    validation_status: data.validation_status,
    assignment_status: data.assignment_status,
    fine_type: data.fine_type,
    violation_points: data.violation_points,
    violation_charge: data.violation_charge,
    payment_reference: data.payment_reference,
    entry_type: data.entry_type,
    serial_number: data.serial_number,
    validation_result: data.validation_result,
    last_check_date: data.last_check_date,
    validation_attempts: data.validation_attempts,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}
