
import { DbId } from './database-common';

export interface CustomerInfo {
  id: DbId;
  full_name: string;
  email?: string;
  phone_number?: string;
  address?: string;
}

export interface VehicleInfo {
  id: DbId;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color?: string;
  image_url?: string;
  status?: string;
}

export interface AgreementPayment {
  id: DbId;
  amount: number;
  payment_date: string;
  status: string;
  notes?: string;
  payment_method?: string;
  transaction_id?: string;
}

export interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  currentVehicleId?: string;
  onAssignVehicle: (vehicleId: string) => Promise<void>;
}
