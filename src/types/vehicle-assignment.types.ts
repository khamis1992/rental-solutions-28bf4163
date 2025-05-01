
/**
 * Type definitions for vehicle assignment dialog and related components
 */

export interface CustomerInfo {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  driver_license?: string;
}

export interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year?: number;
  color?: string;
}

export interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  currentVehicleId: string | undefined;
  onAssignVehicle: (vehicleId: string) => Promise<void>;
}
