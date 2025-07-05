
import { LeaseId, VehicleId } from '@/types/database-common';

export interface ReassignmentWizardProps {
  leaseId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface LeaseDetails {
  id: LeaseId | null;
  agreement_number: string | null;
  status: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  start_date: string | null;
  end_date: string | null;
  customerName: string | null;
}

export interface VehicleDetails {
  id: VehicleId | null;
  make: string | null;
  model: string | null;
  license_plate: string | null;
}
