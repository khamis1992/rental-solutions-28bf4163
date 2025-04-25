
export interface VehicleStatusData {
  total: number;
  available: number;
  rented: number;
  maintenance: number;
  police_station?: number;
  accident?: number;
  stolen?: number;
  reserved?: number;
  attention?: number;
  critical?: number;
}
