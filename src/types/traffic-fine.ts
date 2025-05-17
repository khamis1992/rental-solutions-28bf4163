
export interface TrafficFine {
  id: string;
  lease_id?: string;
  leaseId?: string; // Alias for lease_id for backward compatibility
  license_plate: string;
  violation_date: string | Date;
  violation_number?: string;
  violation_charge?: string;
  fine_amount: number;
  location?: string;
  payment_status: string;
  payment_date?: string | Date | null;
}
