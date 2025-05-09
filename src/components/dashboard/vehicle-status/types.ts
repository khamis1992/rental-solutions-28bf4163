
import { VehicleStatus } from '@/types/vehicle';

export interface StatusConfig {
  key: string;
  name: string;
  color: string;
  icon: React.ComponentType;
  description: string;
  filterValue: VehicleStatus;
}

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
