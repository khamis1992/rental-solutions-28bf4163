
export interface TrafficFine {
  id: string;
  violation_number: string;
  license_plate: string;
  vehicle_id: string;
  lease_id?: string; // Optional to handle cases without leases
  violation_date: string;
  fine_amount: number;
  violation_charge?: string;
  payment_status: string;
  fine_location?: string;
  payment_date?: string | null;
}

export interface TrafficFineFilter {
  status?: string[];
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  licensePlate?: string;
  violationType?: string[];
}
