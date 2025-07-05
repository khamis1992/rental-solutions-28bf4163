export interface TrafficFine {
  id: string;
  violationNumber: string;
  licensePlate: string;
  violationDate: string | Date;
  fineAmount: number;
  violationCharge?: string;
  paymentStatus: string;
  paymentDate?: string | Date | null;
  location?: string;
  vehicleId?: string;
  customerId?: string;
  customerName?: string;
  leaseId?: string;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
}
