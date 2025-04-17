
export interface VehicleTypeDistribution {
  type: string;
  count: number;
  avgDailyRate?: number;
}

export interface FleetStats {
  totalVehicles: number;
  availableCount: number;
  maintenanceCount: number;
  rentedCount: number;
  activeVehicles?: number;
  rentalRate?: number;
}
