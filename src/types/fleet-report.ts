
export interface VehicleTypeDistribution {
  type: string;
  count: number;
  avgDailyRate?: number;
  vehicleType?: string;  // Added for compatibility
}

export interface FleetStats {
  totalVehicles: number;
  availableCount: number;
  maintenanceCount: number;
  rentedCount: number;
  activeVehicles?: number;
  rentalRate?: number;
}
