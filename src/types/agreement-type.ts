
export interface AgreementBasicInfo {
  id: string;
  customer_id: string;
  start_date: Date;
  end_date?: Date;
  status: string;
  vehicle_id: string;
}
