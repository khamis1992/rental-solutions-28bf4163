
export interface CustomerInfo {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  driver_license?: string;
}

export interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year: number;
  color?: string;
}

export interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId?: string;
  currentVehicleId?: string;
  onAssignVehicle: (vehicleId: string) => Promise<void>;
}

export interface Payment {
  id: string;
  amount: number;
  payment_date?: string;
  status: string;
  description?: string;
  payment_method?: string;
  days_overdue?: number;
  late_fine_amount?: number;
}

export interface TrafficFine {
  id: string;
  violation_number: string;
  fine_amount: number;
  payment_status: string;
  violation_date: string;
}
