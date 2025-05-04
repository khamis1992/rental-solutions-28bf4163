
import { Payment } from './payment-history.types';
import { TrafficFine } from '@/hooks/use-traffic-fines';

export interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year?: number;
  color?: string | null;
}

export interface CustomerInfo {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
}

export interface VehicleAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicleId: string;
  existingAgreement?: {
    id: string;
    agreement_number: string;
  };
}

