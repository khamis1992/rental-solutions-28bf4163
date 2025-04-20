
export interface Agreement {
  id: string;
  customerId: string;
  vehicleId: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  agreementNumber: string;
  // ... add other needed fields
}
