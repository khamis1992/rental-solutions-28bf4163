
export interface AgreementBasicInfo {
  id: string;
  customer_id: string;
  start_date: Date;
  end_date?: Date;
  status: string;
  vehicle_id: string;
}

// Add more specific types to prevent deep type instantiation
export interface AgreementSummary extends AgreementBasicInfo {
  customerName?: string;
  vehicleLicensePlate?: string;
}
