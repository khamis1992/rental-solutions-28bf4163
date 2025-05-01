
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

export interface ExistingAgreement {
  id: string;
  agreement_number: string;
}

export interface VehicleAvailabilityResult {
  isAvailable: boolean;
  existingAgreement?: ExistingAgreement;
  error?: string;
}

export interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  description?: string;
  payment_method?: string;
}

export interface TrafficFine {
  id: string;
  violation_number: string;
  fine_amount: number;
  payment_status: string;
  violation_date: string;
}
