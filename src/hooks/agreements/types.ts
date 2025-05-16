
import { CustomerInfo } from '@/types/customer';

export interface SimpleAgreement {
  id: string;
  status: string;
  customer_id?: string;
  vehicle_id?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string; 
  total_amount?: number;
  agreement_number?: string;
  agreement_type?: string;
  customer_name?: string;
  payment_frequency?: string;
  payment_day?: number;
  customers?: {
    id?: string;
    full_name?: string;
  };
  profiles?: {
    id?: string;
    full_name?: string;
  };
  vehicles?: {
    id?: string;
    make?: string;
    model?: string;
    license_plate?: string;
  };
}

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface PaginationControls extends PaginationState {
  totalCount: number;
  totalPages: number;
  handlePageChange: (newPage: number, newPageSize?: number) => void;
}

export interface AgreementFilters {
  [key: string]: string | undefined | number;
}

export interface UseAgreementsResult {
  agreements: SimpleAgreement[];
  isLoading: boolean;
  error: Error | null;
  updateAgreement: (params: { id: string; data: any }) => Promise<any>;
  deleteAgreements: (ids: string[]) => Promise<void>;
  searchParams: AgreementFilters;
  setSearchParams: (newFilters: AgreementFilters) => void;
  setFilters: React.Dispatch<React.SetStateAction<AgreementFilters>>;
  customer: CustomerInfo | null;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerInfo | null>>;
  pagination: PaginationControls;
  refetch: () => void;
}
