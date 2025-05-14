
export interface AgreementFilters {
  id?: string;
  customerId?: string;
  vehicleId?: string;
  status?: string | string[];
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  endDateFrom?: Date | string;
  endDateTo?: Date | string;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface VehicleFilters {
  id?: string;
  make?: string;
  model?: string;
  year?: number | string;
  licensePlate?: string;
  status?: string | string[];
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface CustomerFilters {
  id?: string;
  status?: string | string[];
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface PaymentFilters {
  id?: string;
  leaseId?: string;
  status?: string | string[];
  paymentDateFrom?: Date | string;
  paymentDateTo?: Date | string;
  dueDateFrom?: Date | string;
  dueDateTo?: Date | string;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}
