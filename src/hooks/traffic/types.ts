
// Traffic Fine related types
export interface TrafficFine {
  id: string;
  violation_number: string;
  license_plate: string;
  violation_date: string;
  fine_amount: number;
  violation_charge: string;
  payment_status: string;
  fine_location: string;
  vehicle_id?: string | null;
  lease_id?: string | null;
  payment_date?: string | null;
  assignment_status?: string | null;
  customer_id?: string;
  customerName?: string;
}

export interface TrafficFineCustomer {
  id: string;
  lease_id: string;
  customer_id: string;
  customer_name?: string;
  start_date: string;
  end_date: string;
}

export type TrafficFineCreatePayload = Omit<TrafficFine, 'id'>;

export interface UseLegalCasesOptions {
  customerId?: string;
  agreementId?: string;
  status?: string;
}

export interface TrafficFineMutationResult {
  success: boolean;
  id?: string;
  count?: number;
}

export interface UseTrafficFinesResult {
  fines: TrafficFine[];
  customerData: TrafficFineCustomer | null;
  isLoading: boolean;
  error: Error | null;
  fetchFines: () => Promise<void>;
  markFineAsPaid: (fineId: string, paymentDate: string) => Promise<boolean>;
  addNewFine: (fineData: TrafficFineCreatePayload) => Promise<boolean>;
  payTrafficFine: {
    mutate: (params: { id: string }) => Promise<TrafficFineMutationResult>;
    mutateAsync: (params: { id: string }) => Promise<TrafficFineMutationResult>;
    isLoading: boolean;
  };
  disputeTrafficFine: {
    mutate: (params: { id: string }) => Promise<TrafficFineMutationResult>;
    mutateAsync: (params: { id: string }) => Promise<TrafficFineMutationResult>;
    isLoading: boolean;
  };
  assignToCustomer: {
    mutate: (params: { id: string }) => Promise<TrafficFineMutationResult>;
    mutateAsync: (params: { id: string }) => Promise<TrafficFineMutationResult>;
    isLoading: boolean;
  };
  cleanupInvalidAssignments: {
    mutate: () => Promise<TrafficFineMutationResult>;
    mutateAsync: () => Promise<TrafficFineMutationResult>;
    isLoading: boolean;
  };
  createTrafficFine: (fineData: TrafficFineCreatePayload) => Promise<boolean>;
  trafficFines: TrafficFine[]; // For backward compatibility
}
